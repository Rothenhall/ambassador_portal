"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SignalMeter } from "@/components/ui/SignalMeter";
import { LoopDiagram } from "@/components/ui/LoopDiagram";
import { TrackRing } from "@/components/ui/TrackRing";
import { WeekRail } from "@/components/ui/WeekRail";
import { IconFlame } from "@/components/icons";
import { relativeTime } from "@/lib/format";
import type { TrackKey } from "@/lib/signal";
import type { DashTask, AmbassadorDashboardData } from "@/lib/dashboard";

const TRACKS_ORDER: TrackKey[] = ["A", "B", "C", "D", "E"];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }),
};

export function ProgressPanel({
  tasks,
  ledger,
  signalTotal,
  week,
  totalWeeks,
}: {
  tasks: DashTask[];
  ledger: AmbassadorDashboardData["ledger"];
  signalTotal: number;
  week: number;
  totalWeeks: number;
}) {
  const trackStats = useMemo(
    () =>
      TRACKS_ORDER.map((t) => ({
        track: t,
        done: tasks.filter((x) => x.track === t && x.status === "accepted").length,
        total: tasks.filter((x) => x.track === t).length,
      })),
    [tasks]
  );

  const currentTrack = useMemo(() => {
    const now = new Date();
    const open = tasks
      .filter((t) => new Date(t.opensAt) <= now && t.status !== "accepted")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    return (open[0]?.track as TrackKey) ?? "A";
  }, [tasks]);

  const weekSummaries = useMemo(
    () =>
      Array.from({ length: totalWeeks }, (_, i) => {
        const codes = tasks.filter((t) => t.week === i + 1).map((t) => t.code);
        return codes.length ? codes.join(", ") : "self-paced only";
      }),
    [tasks, totalWeeks]
  );

  const streak = useMemo(() => {
    let s = 0;
    for (let wk = 1; wk < week; wk++) {
      const weekTasks = tasks.filter((t) => t.week === wk);
      const hasAccepted = weekTasks.some((t) => t.status === "accepted");
      if (weekTasks.length === 0 || hasAccepted) s++;
      else break;
    }
    return s;
  }, [tasks, week]);

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1.4fr)]">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="card flex flex-col gap-3 p-4">
          <SignalMeter value={signalTotal} showBand />
          <div className="flex items-center gap-2 text-xs text-ink-45">
            <motion.span
              animate={streak > 0 ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -4, 3, -2, 0] } : {}}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
            >
              <IconFlame className="h-3.5 w-3.5 text-brass" />
            </motion.span>
            {streak > 0 ? `${streak} week${streak === 1 ? "" : "s"} unbroken` : "Your streak starts this week"}
          </div>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="card flex flex-col items-center gap-1 p-4">
          <p className="eyebrow self-start !text-[0.6rem]">The loop</p>
          <LoopDiagram current={currentTrack} />
        </motion.div>

        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="card flex flex-wrap items-center justify-around gap-3 p-4">
          {trackStats.map((s) => (
            <TrackRing key={s.track} track={s.track} done={s.done} total={s.total} />
          ))}
        </motion.div>
      </div>

      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="card p-4">
        <p className="eyebrow mb-3 !text-[0.6rem]">Week rail</p>
        <WeekRail totalWeeks={totalWeeks} currentWeek={week} summaries={weekSummaries} />
      </motion.div>

      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="card p-4">
        <p className="eyebrow mb-2 !text-[0.6rem]">Signal ledger</p>
        {ledger.length === 0 ? (
          <p className="py-2 text-sm text-ink-45">Nothing recorded yet.</p>
        ) : (
          <ul className="flex max-h-64 flex-col divide-y divide-line overflow-y-auto">
            {ledger.map((l, i) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="truncate text-ink-60">
                  <strong className="text-ink">{l.taskCode}</strong> {l.taskTitle}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-ink-45">
                  {relativeTime(l.createdAt)}
                  <span className="font-medium text-[#3f6b4a]">+{l.delta}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
