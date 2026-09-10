"use client";

import { motion } from "framer-motion";
import { TRACKS, type TrackKey } from "@/lib/signal";

const STROKE: Record<TrackKey, string> = {
  A: "#9a7a4a",
  B: "#a85c30",
  C: "#7c6238",
  D: "#5c5648",
  E: "#8a4a26",
};

export function TrackRing({ track, done, total }: { track: TrackKey; done: number; total: number }) {
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#efe9dc" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[track]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="text-center">
        <p className="text-[0.68rem] uppercase tracking-wider text-ink-45">{TRACKS[track].name}</p>
        <p className="text-xs font-medium text-ink">
          {done} of {total}
        </p>
      </div>
    </div>
  );
}
