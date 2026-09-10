"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserMenu } from "@/components/shell/UserMenu";
import { TabSwitcher } from "@/components/shell/TabSwitcher";
import { Drawer } from "@/components/shell/Drawer";
import { LogoLockup } from "@/components/brand/Logo";
import { ProgressHero } from "@/components/progress/ProgressHero";
import { TasksPanel } from "@/components/dashboard/TasksPanel";
import { ProgressPanel } from "@/components/dashboard/ProgressPanel";
import { RewardsPanel } from "@/components/dashboard/RewardsPanel";
import { CirclePanel } from "@/components/dashboard/CirclePanel";
import { LibraryPanel } from "@/components/dashboard/LibraryPanel";
import { TaskDrawerContent } from "@/components/dashboard/TaskDrawerContent";
import { Pill } from "@/components/ui/Pill";
import { tierAtLeast } from "@/lib/signal";
import type { AmbassadorDashboardData } from "@/lib/dashboard";

export function Dashboard({ data, initialTab }: { data: AmbassadorDashboardData; initialTab?: string }) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  const openTask = useMemo(() => data.tasks.find((t) => t.code === openCode) ?? null, [data.tasks, openCode]);
  const needsChanges = data.tasks.filter((t) => t.attempts[0]?.status === "changes_requested");

  const weekTasks = data.tasks.filter((t) => t.week === data.week);
  const weekDone = weekTasks.filter((t) => t.status === "accepted").length;

  const streak = useMemo(() => {
    let s = 0;
    for (let wk = 1; wk < data.week; wk++) {
      const wkTasks = data.tasks.filter((t) => t.week === wk);
      if (wkTasks.length === 0 || wkTasks.some((t) => t.status === "accepted")) s++;
      else break;
    }
    return s;
  }, [data.tasks, data.week]);

  const nextReward = useMemo(() => {
    const granted = new Set(data.grants.filter((g) => g.status !== "locked").map((g) => g.rewardId));
    return (
      data.rewards
        .filter((r) => !granted.has(r.id) && (r.signalGate > data.membership.signalTotal || !tierAtLeast(data.membership.tier, r.tierGate)))
        .sort((a, b) => a.signalGate - b.signalGate)[0] ?? null
    );
  }, [data.rewards, data.grants, data.membership]);

  const tabs = [
    { key: "tasks", label: "Tasks", panel: <TasksPanel tasks={data.tasks} week={data.week} onOpen={setOpenCode} /> },
    {
      key: "progress",
      label: "Progress",
      panel: <ProgressPanel tasks={data.tasks} ledger={data.ledger} signalTotal={data.membership.signalTotal} week={data.week} totalWeeks={data.totalWeeks} />,
    },
    {
      key: "rewards",
      label: "Rewards",
      panel: (
        <RewardsPanel
          rewards={data.rewards}
          grants={data.grants}
          tier={data.membership.tier}
          signalTotal={data.membership.signalTotal}
          certificate={data.certificate}
          onVerify={() => data.certificate && window.open(`/verify/${data.certificate.publicId}`, "_blank")}
        />
      ),
    },
    {
      key: "circle",
      label: "Circle",
      panel: <CirclePanel me={data.user} directory={data.directory} leaderboard={data.leaderboard} myRank={data.myRank} cohortSize={data.cohortSize} />,
    },
    {
      key: "library",
      label: "Library",
      panel: <LibraryPanel modules={data.modules} completedIds={data.moduleProgress} onOpenAssessment={() => setOpenCode("D7")} />,
    },
  ];

  return (
    <div className="ground min-h-screen">
      <div className="relative">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-canvas/80 px-6 backdrop-blur-xl">
          <LogoLockup height={18} />
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-line bg-paper/70 px-3 py-1.5 sm:flex">
              <span className="font-display text-sm font-bold leading-none">{data.membership.signalTotal}</span>
              <span className="eyebrow !text-[0.56rem] text-ink-45">Signal</span>
            </span>
            <UserMenu name={data.user.name} role={data.user.role} color={data.user.avatarColor} />
          </div>
        </header>

        {needsChanges.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpenCode(needsChanges[0].code)}
            className="flex w-full items-center justify-between border-b border-cognac/25 bg-cognac/[0.07] px-6 py-2.5 text-left text-sm font-medium text-cognac-deep transition-colors hover:bg-cognac/[0.12]"
          >
            <span>
              {needsChanges.length === 1
                ? `1 task needs changes — ${needsChanges[0].code} ${needsChanges[0].title}`
                : `${needsChanges.length} tasks need changes`}
            </span>
            <span>&rarr;</span>
          </motion.button>
        )}

        <div className="mx-auto max-w-5xl pb-10">
          <ProgressHero
            name={data.user.name}
            signal={data.membership.signalTotal}
            week={data.week}
            totalWeeks={data.totalWeeks}
            weekDone={weekDone}
            weekTotal={weekTasks.length}
            streak={streak}
            nextRewardName={nextReward?.name.toLowerCase() ?? null}
          />

          {data.announcement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mx-6 mt-4 rounded-sm2 border border-line bg-paper/60 px-4 py-2.5 text-xs text-ink-60"
            >
              <span className="eyebrow mr-2 !text-[0.56rem]">Announcement</span>
              {data.announcement}
            </motion.div>
          )}

          <div className="mt-6">
            {/* top-16 parks the tab bar directly under the locked h-16 header. */}
            <TabSwitcher tabs={tabs} initial={initialTab} stickyTop="top-16" />
          </div>
        </div>
      </div>

      <Drawer
        open={!!openTask}
        onClose={() => setOpenCode(null)}
        eyebrow={openTask ? `${openTask.code} · ${openTask.week === data.week ? "This week" : `Week ${openTask.week}`}` : undefined}
        title={openTask?.title}
        right={openTask ? <Pill status={openTask.attempts[0]?.status ?? "open"} /> : undefined}
      >
        {openTask && <TaskDrawerContent task={openTask} />}
      </Drawer>
    </div>
  );
}
