"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

/**
 * Progress toward the *next* goal, not toward 1000 — a gap you can close this week
 * reads as reachable in a way "34% of the whole cohort" never does.
 */
export function GoalRing({
  value,
  goal,
  floor = 0,
  size = 168,
  label = "Signal",
  caption,
}: {
  value: number;
  goal: number;
  /** Signal level the current band started at, so the ring shows progress across this leg only. */
  floor?: number;
  size?: number;
  label?: string;
  caption?: string;
}) {
  const span = Math.max(1, goal - floor);
  const pct = Math.max(0, Math.min(1, (value - floor) / span));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="goal-ring-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9a7a4a" />
            <stop offset="100%" stopColor="#a85c30" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#efe9dc" strokeWidth={stroke} strokeLinecap="round" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#goal-ring-fill)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={value} className="font-display text-[2.6rem] font-bold leading-none tracking-tightest text-ink" />
        <span className="eyebrow mt-1 !text-[0.58rem] text-ink-45">{label}</span>
      </div>

      {caption && <p className="mt-3 text-center text-xs text-ink-60">{caption}</p>}
    </div>
  );
}
