import { db } from "@/lib/db";
import { parseConfig, parseRubric } from "@/lib/tasks";
import { hoursSince } from "@/lib/format";
import { currentWeek } from "@/lib/cohort";

export async function getAdminDashboard() {
  const cohort = await db.cohort.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
  const { week } = currentWeek(cohort.startsAt, cohort.endsAt);

  const [
    pendingSubs,
    ambassadorsRaw,
    decisions,
    weekTasks,
    allTasks,
    applications,
    grants,
    announcements,
    libraryModules,
    reviewers,
    submissionCounts,
  ] = await Promise.all([
    db.submission.findMany({
      where: { status: "submitted" },
      orderBy: { submittedAt: "asc" },
      include: { user: { include: { membership: { include: { campus: true } } } }, task: true },
    }),
    db.user.findMany({
      where: { role: "ambassador" },
      include: {
        membership: { include: { campus: true } },
        submissions: { orderBy: { createdAt: "desc" }, include: { task: true } },
        ledgerEntries: { orderBy: { createdAt: "desc" } },
        rewardGrants: { include: { reward: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.review.findMany({ where: { reviewedAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    db.task.findMany({ where: { cohortId: cohort.id, week, published: true } }),
    db.task.findMany({ where: { cohortId: cohort.id }, orderBy: { week: "asc" } }),
    db.application.findMany({ orderBy: { createdAt: "desc" } }),
    db.rewardGrant.findMany({ where: { status: { in: ["claimed", "fulfilled"] } }, include: { user: true, reward: true }, orderBy: { createdAt: "desc" } }),
    db.announcement.findMany({ where: { cohortId: cohort.id }, orderBy: { publishedAt: "desc" } }),
    db.libraryModule.findMany({ orderBy: { order: "asc" } }),
    db.user.findMany({ where: { role: { in: ["admin", "reviewer"] } } }),
    db.submission.groupBy({ by: ["taskId", "status"], _count: true }),
  ]);

  const oldest = pendingSubs[0];
  const oldestHours = oldest ? hoursSince(oldest.submittedAt ?? oldest.createdAt) : 0;
  const accepted = decisions.filter((d) => d.decision === "accepted").length;
  const acceptRate = decisions.length ? Math.round((accepted / decisions.length) * 100) : 0;
  const atRisk = ambassadorsRaw.filter((u) => !u.submissions[0] || hoursSince(u.submissions[0].createdAt) > 240).length;

  const weekTaskIds = weekTasks.map((t) => t.id);
  const weekSubs = weekTaskIds.length ? await db.submission.findMany({ where: { taskId: { in: weekTaskIds } } }) : [];
  const funnel = {
    opened: ambassadorsRaw.length * weekTasks.length,
    drafted: weekSubs.filter((s) => s.status === "draft").length,
    submitted: weekSubs.filter((s) => s.status !== "draft").length,
    reviewed: weekSubs.filter((s) => s.status === "accepted" || s.status === "changes_requested").length,
  };

  const countsByTask = new Map<string, Record<string, number>>();
  for (const c of submissionCounts) {
    const m = countsByTask.get(c.taskId) ?? {};
    m[c.status] = c._count;
    countsByTask.set(c.taskId, m);
  }

  return {
    cohort: { id: cohort.id, name: cohort.name, startsAt: cohort.startsAt.toISOString(), endsAt: cohort.endsAt.toISOString(), week },
    stats: { oldestHours, oldestLabel: oldest ? `${oldest.user.name}, ${oldest.task.code}` : null, activeCount: ambassadorsRaw.length, pendingCount: pendingSubs.length, acceptRate, atRisk, funnel },
    reviewQueue: pendingSubs.map((s) => ({
      id: s.id,
      attemptNo: s.attemptNo,
      ageHours: hoursSince(s.submittedAt ?? s.createdAt),
      ambassador: { name: s.user.name, color: s.user.avatarColor, campus: s.user.membership?.campus.name ?? "", lane: s.user.lane ?? "" },
      task: {
        code: s.task.code,
        title: s.task.title,
        track: s.task.track,
        submissionType: s.task.submissionType,
        signalValue: s.task.signalValue,
        config: parseConfig(s.task),
        rubric: parseRubric(s.task),
      },
      content: JSON.parse(s.content),
    })),
    ambassadors: ambassadorsRaw.map((u) => {
      const last = u.submissions[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarColor: u.avatarColor,
        lane: u.lane,
        campusName: u.membership?.campus.name ?? "",
        tier: u.membership?.tier ?? "ambassador",
        signalTotal: u.membership?.signalTotal ?? 0,
        acceptedCount: u.submissions.filter((s) => s.status === "accepted").length,
        submittedCount: u.submissions.filter((s) => s.status !== "draft").length,
        lastActiveISO: last?.createdAt.toISOString() ?? null,
        atRisk: !last || hoursSince(last.createdAt) > 240,
        submissions: u.submissions.map((s) => ({ id: s.id, code: s.task.code, title: s.task.title, status: s.status, attemptNo: s.attemptNo })),
        ledger: u.ledgerEntries.map((l) => ({ id: l.id, taskCode: l.taskCode, delta: l.delta })),
        grants: u.rewardGrants.map((g) => ({ id: g.id, rewardName: g.reward.name, status: g.status })),
      };
    }),
    tasks: allTasks.map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      track: t.track,
      week: t.week,
      submissionType: t.submissionType,
      signalValue: t.signalValue,
      opensAtISO: t.opensAt.toISOString(),
      dueAtISO: t.dueAt.toISOString(),
      published: t.published,
      accepted: countsByTask.get(t.id)?.accepted ?? 0,
    })),
    applications: applications.map((a) => ({ id: a.id, name: a.name, campus: a.campus, field: a.field, answerText: a.answerText, status: a.status, createdAtISO: a.createdAt.toISOString() })),
    rewardGrants: grants.map((g) => ({ id: g.id, userName: g.user.name, userColor: g.user.avatarColor, rewardName: g.reward.name, status: g.status, detail: g.detail, createdAtISO: g.createdAt.toISOString() })),
    announcements: announcements.map((a) => ({ id: a.id, bodyMd: a.bodyMd, publishedAtISO: a.publishedAt.toISOString() })),
    libraryModules: libraryModules.map((m) => ({ id: m.id, code: m.code, title: m.title })),
    reviewers: reviewers.map((r) => ({ id: r.id, name: r.name, role: r.role })),
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;
