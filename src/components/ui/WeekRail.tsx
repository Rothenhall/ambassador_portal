"use client";

import { motion, useReducedMotion } from "framer-motion";

export function WeekRail({
  totalWeeks,
  currentWeek,
  summaries,
}: {
  totalWeeks: number;
  currentWeek: number;
  summaries: string[]; // index 0 = week 1
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wk) => {
        const state = wk === currentWeek ? "current" : wk < currentWeek ? "past" : "future";
        return (
          <div key={wk} className="group relative flex-1" title={`Week ${wk} — ${summaries[wk - 1] ?? "nothing due"}`}>
            <motion.div
              className={`h-1.5 rounded-full ${state === "past" ? "bg-ink-45" : state === "future" ? "bg-line" : ""}`}
              style={state === "current" ? { backgroundColor: "#a85c30" } : undefined}
              animate={
                state === "current" && !reduceMotion
                  ? { opacity: [1, 0.55, 1] }
                  : { opacity: 1 }
              }
              transition={state === "current" ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
            />
            <span
              className={`mt-1 block text-center text-[0.6rem] ${
                state === "current" ? "font-medium text-cognac-deep" : "text-ink-45"
              }`}
            >
              {wk}
            </span>
          </div>
        );
      })}
    </div>
  );
}
