"use client";

import { motion } from "framer-motion";
import { GoalRing } from "@/components/progress/GoalRing";
import { MilestoneTrack, TIER_MILESTONES } from "@/components/progress/MilestoneTrack";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { IconFlame } from "@/components/icons";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProgressHero({
  name,
  signal,
  week,
  totalWeeks,
  weekDone,
  weekTotal,
  streak,
  nextRewardName,
}: {
  name: string;
  signal: number;
  week: number;
  totalWeeks: number;
  weekDone: number;
  weekTotal: number;
  streak: number;
  nextRewardName: string | null;
}) {
  const next = TIER_MILESTONES.find((m) => m.at > signal) ?? TIER_MILESTONES[TIER_MILESTONES.length - 1];
  const prev = [...TIER_MILESTONES].reverse().find((m) => m.at <= signal) ?? TIER_MILESTONES[0];
  const gap = Math.max(0, next.at - signal);
  const firstName = name.split(" ")[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="frost mx-6 mt-5 flex flex-col items-center gap-7 px-7 py-7 lg:flex-row lg:gap-10"
    >
      <GoalRing
        value={signal}
        goal={next.at}
        floor={prev.at}
        caption={gap > 0 ? `${gap} to ${next.label}` : "Every gate cleared"}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <p className="eyebrow">Cohort 01 · Week {week} of {totalWeeks}</p>
          <h2 className="mt-1.5 font-display text-2xl tracking-tighter2">
            {gap > 0 ? (
              <>
                <span className="text-cognac-deep">{gap} Signal</span> to {nextRewardName ?? next.label.toLowerCase()}, {firstName}.
              </>
            ) : (
              <>You have cleared every gate, {firstName}.</>
            )}
          </h2>
        </div>

        <MilestoneTrack value={signal} />

        <div className="grid grid-cols-3 gap-3 border-t border-line/70 pt-5">
          <Stat label="This week" value={weekDone} of={weekTotal} pct={weekTotal ? weekDone / weekTotal : 0} />
          <Stat label="Cohort" value={week} of={totalWeeks} pct={week / totalWeeks} suffix="wks" />
          <div className="flex flex-col gap-1.5">
            <p className="eyebrow !text-[0.58rem]">Streak</p>
            <p className="flex items-baseline gap-1.5 font-display text-xl font-semibold leading-none">
              <motion.span
                animate={streak > 0 ? { scale: [1, 1.18, 0.96, 1.06, 1], rotate: [0, -6, 4, -2, 0] } : {}}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                className="inline-flex"
              >
                <IconFlame className="h-4 w-4 text-brass" />
              </motion.span>
              <AnimatedNumber value={streak} />
              <span className="text-xs font-normal text-ink-45">{streak === 1 ? "week" : "weeks"}</span>
            </p>
            <p className="text-[0.62rem] text-ink-45">{streak > 0 ? "unbroken" : "starts this week"}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Stat({ label, value, of, pct, suffix }: { label: string; value: number; of: number; pct: number; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="eyebrow !text-[0.58rem]">{label}</p>
      <p className="font-display text-xl font-semibold leading-none">
        <AnimatedNumber value={value} />
        <span className="text-xs font-normal text-ink-45">
          {" "}
          of {of} {suffix}
        </span>
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-canvas-2">
        <motion.div
          className="h-full rounded-full bg-brass"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct * 100)}%` }}
          transition={{ duration: 1, ease, delay: 0.3 }}
        />
      </div>
    </div>
  );
}
