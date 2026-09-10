"use client";

import { motion } from "framer-motion";
import { SIGNAL_TOTAL } from "@/lib/signal";
import { IconCheck } from "@/components/icons";

export type Milestone = { at: number; label: string; sub?: string };

export const TIER_MILESTONES: Milestone[] = [
  { at: 0, label: "Ambassador", sub: "Joined" },
  { at: 500, label: "Senior", sub: "Certificate, kit" },
  { at: 800, label: "Campus Lead", sub: "Byline, session" },
  { at: SIGNAL_TOTAL, label: "Alumnus", sub: "Letter, case study" },
];

/** The whole twelve weeks as one road, with where you stand marked on it. */
export function MilestoneTrack({ value, milestones = TIER_MILESTONES }: { value: number; milestones?: Milestone[] }) {
  const pct = Math.max(0, Math.min(100, (value / SIGNAL_TOTAL) * 100));

  return (
    <div className="w-full">
      <div className="relative h-1.5 w-full rounded-full bg-canvas-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brass to-cognac"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
        {/* the "you are here" head */}
        <motion.span
          className="absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-cognac shadow-soft"
          initial={{ left: "0%", scale: 0 }}
          animate={{ left: `${pct}%`, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />

        {milestones.map((m, i) => {
          const at = (m.at / SIGNAL_TOTAL) * 100;
          const reached = value >= m.at;
          return (
            <motion.span
              key={m.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 400, damping: 22 }}
              style={{ left: `${at}%` }}
              className={`absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${
                reached ? "border-paper bg-brass text-white" : "border-line-strong bg-paper text-transparent"
              }`}
            >
              {reached && <IconCheck className="h-2.5 w-2.5" />}
            </motion.span>
          );
        })}
      </div>

      {/* Labels stay terse (name + threshold only) so the last two don't collide at 800/1000.
          What each gate actually unlocks is carried by the headline above, not repeated here. */}
      <div className="relative mt-3 h-8">
        {milestones.map((m, i) => {
          const at = (m.at / SIGNAL_TOTAL) * 100;
          const reached = value >= m.at;
          const isNext = !reached && milestones.filter((x) => x.at > value)[0]?.at === m.at;
          const first = i === 0;
          const last = i === milestones.length - 1;
          return (
            <div
              key={m.label}
              className={`absolute top-0 ${first ? "left-0" : last ? "right-0 text-right" : ""}`}
              style={first || last ? undefined : { left: `${at}%`, transform: "translateX(-50%)" }}
            >
              <p
                className={`max-w-[4.6rem] text-[0.68rem] font-semibold leading-tight ${first ? "" : last ? "ml-auto" : "mx-auto text-center"} ${
                  isNext ? "text-cognac-deep" : reached ? "text-ink" : "text-ink-45"
                }`}
              >
                {m.label}
              </p>
              <p className={`text-[0.6rem] leading-tight text-ink-45 ${first || last ? "" : "text-center"}`}>
                {m.at === 0 ? "Joined" : m.at}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
