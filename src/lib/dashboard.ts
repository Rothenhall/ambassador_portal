import { db } from "@/lib/db";
import { parseConfig, parseRubric } from "@/lib/tasks";
import { currentWeek } from "@/lib/cohort";

export type DashTask = {
  id: string;
  code: string;
  title: string;
  summary: string;
  briefMd: string;
  track: string;
  week: number;
  submissionType: string;
  config: any;
  rubric: string[];
  signalValue: number;
  opensAt: string;
  dueAt: string;
  status: string;
  attempts: {
    id: string;
    attemptNo: number;
    status: string;
    content: any;
    submittedAt: string | null;
    createdAt: string;
    feedbackMd: string | null;
  }[];
};

export async function getAmbassadorDashboard(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { membership: { include: { cohort: true, campus: true } } },
  });
  const membership = user.membership!;
  const { week, totalWeeks } = currentWeek(membership.cohort.startsAt, membership.cohort.endsAt);

  const [tasks, allSubmissions, ledger, rewards, grants, certificate, modules, moduleProgress, cohortMembers, announcement] =
    await Promise.all([
      db.task.findMany({ where: { cohortId: membership.cohortId, published: true }, orderBy: { week: "asc" } }),
      db.submission.findMany({
        where: { userId },
        orderBy: { attemptNo: "desc" },
        include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
      }),
      db.signalLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      db.reward.findMany({ orderBy: { signalGate: "asc" } }),
      db.rewardGrant.findMany({ where: { userId } }),
      db.certificate.findUnique({ where: { userId } }),
      db.libraryModule.findMany({ orderBy: { order: "asc" } }),
      db.moduleProgress.findMany({ where: { userId } }),
      db.user.findMany({
        where: { role: "ambassador", membership: { cohortId: membership.cohortId } },
        include: { membership: { include: { campus: true } } },
      }),
      db.announcement.findFirst({ where: { cohortId: membership.cohortId }, orderBy: { publishedAt: "desc" } }),
    ]);

  const subsByTask = new Map<string, typeof allSubmissions>();
  for (const s of allSubmissions) subsByTask.set(s.taskId, [...(subsByTask.get(s.taskId) ?? []), s]);

  const now = new Date();
  const dashTasks: DashTask[] = tasks.map((t) => {
    const subs = (subsByTask.get(t.id) ?? []).sort((a, b) => b.attemptNo - a.attemptNo);
    const latest = subs[0];
    const status = latest?.status ?? (t.opensAt > now ? "locked" : t.dueAt < now ? "missed" : "open");
    return {
      id: t.id,
      code: t.code,
      title: t.title,
      summary: t.summary,
      briefMd: t.briefMd,
      track: t.track,
      week: t.week,
      submissionType: t.submissionType,
      config: parseConfig(t),
      rubric: parseRubric(t),
      signalValue: t.signalValue,
      opensAt: t.opensAt.toISOString(),
      dueAt: t.dueAt.toISOString(),
      status,
      attempts: subs.map((s) => ({
        id: s.id,
        attemptNo: s.attemptNo,
        status: s.status,
        content: JSON.parse(s.content),
        submittedAt: s.submittedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        feedbackMd: s.reviews[0]?.feedbackMd ?? null,
      })),
    };
  });

  const ranked = [...cohortMembers].sort((a, b) => (b.membership?.signalTotal ?? 0) - (a.membership?.signalTotal ?? 0));
  const myRank = ranked.findIndex((m) => m.id === userId) + 1;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      pageUrl: user.pageUrl,
      lane: user.lane,
      bio: user.bio,
      showInDirectory: user.showInDirectory,
      showOnLeaderboard: user.showOnLeaderboard,
    },
    membership: {
      tier: membership.tier,
      signalTotal: membership.signalTotal,
      campusName: membership.campus.name,
      cohortId: membership.cohortId,
    },
    week,
    totalWeeks,
    tasks: dashTasks,
    ledger: ledger.map((l) => ({ id: l.id, taskCode: l.taskCode, taskTitle: l.taskTitle, delta: l.delta, reason: l.reason, createdAt: l.createdAt.toISOString() })),
    rewards: rewards.map((r) => ({ id: r.id, code: r.code, name: r.name, description: r.description, tierGate: r.tierGate, signalGate: r.signalGate, fulfilmentType: r.fulfilmentType })),
    grants: grants.map((g) => ({ rewardId: g.rewardId, status: g.status, detail: g.detail })),
    certificate: certificate ? { publicId: certificate.publicId } : null,
    modules: modules.map((m) => ({ id: m.id, code: m.code, title: m.title, summary: m.summary, bodyMd: m.bodyMd, order: m.order })),
    moduleProgress: moduleProgress.filter((p) => p.completedAt).map((p) => p.moduleId),
    directory: cohortMembers
      .filter((m) => m.showInDirectory)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({ id: m.id, name: m.name, avatarColor: m.avatarColor, campusName: m.membership?.campus.name ?? "", lane: m.lane, pageUrl: m.pageUrl })),
    leaderboard: ranked
      .filter((m) => m.showOnLeaderboard)
      .slice(0, 10)
      .map((m) => ({ id: m.id, name: m.name, avatarColor: m.avatarColor, signalTotal: m.membership?.signalTotal ?? 0 })),
    myRank,
    cohortSize: cohortMembers.length,
    announcement: announcement?.bodyMd ?? null,
  };
}

export type AmbassadorDashboardData = Awaited<ReturnType<typeof getAmbassadorDashboard>>;
