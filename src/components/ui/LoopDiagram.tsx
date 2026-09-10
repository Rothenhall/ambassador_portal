"use client";

import { motion } from "framer-motion";
import { LOOP_STAGES, type TrackKey } from "@/lib/signal";

const COLOR: Record<TrackKey, string> = {
  A: "#9a7a4a",
  B: "#a85c30",
  C: "#7c6238",
  D: "#5c5648",
  E: "#8a4a26",
};

const spring = { type: "spring" as const, stiffness: 260, damping: 24 };

export function LoopDiagram({ current }: { current: TrackKey }) {
  const n = LOOP_STAGES.length;
  const cx = 130,
    cy = 118,
    r = 82;
  const points = LOOP_STAGES.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { ...s, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 260 236" className="w-full max-w-[15rem]">
      {points.map((p, i) => {
        const next = points[(i + 1) % n];
        const midX = (p.x + next.x) / 2 + (cy - (p.y + next.y) / 2) * 0.12;
        const midY = (p.y + next.y) / 2 + ((p.x + next.x) / 2 - cx) * 0.12;
        return (
          <path
            key={`arc-${i}`}
            d={`M ${p.x} ${p.y} Q ${midX} ${midY} ${next.x} ${next.y}`}
            fill="none"
            stroke="#ddd5c4"
            strokeWidth={1.4}
            markerEnd="url(#arrow)"
          />
        );
      })}
      <defs>
        <marker id="arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#cbc0a9" />
        </marker>
      </defs>
      {points.map((p) => {
        const active = p.track === current;
        return (
          <g key={p.track}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              initial={false}
              animate={{ r: active ? 20 : 16, fill: active ? COLOR[p.track] : "#fbf9f3", stroke: active ? COLOR[p.track] : "#cbc0a9" }}
              transition={spring}
              strokeWidth={1.4}
            />
            <motion.text
              x={p.x}
              initial={false}
              animate={{ y: p.y + 4, fontSize: active ? 10.5 : 9.5, fill: active ? "#fbf9f3" : "#857d6c" }}
              transition={spring}
              textAnchor="middle"
              fontFamily="var(--font-poppins), sans-serif"
              fontWeight={500}
            >
              {p.track}
            </motion.text>
            <motion.text
              x={p.x}
              initial={false}
              animate={{ y: active ? p.y + 34 : p.y + 30, fill: active ? "#1a1712" : "#857d6c" }}
              transition={spring}
              textAnchor="middle"
              fontSize={9.5}
              fontFamily="var(--font-poppins), sans-serif"
              fontWeight={active ? 500 : 400}
            >
              {p.stage}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}
