"use client";

import { motion } from "framer-motion";
import { bandFor, SIGNAL_TOTAL } from "@/lib/signal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

export function SignalMeter({
  value,
  showBand = false,
  size = "md",
}: {
  value: number;
  showBand?: boolean;
  size?: "md" | "lg";
}) {
  const pct = Math.min(100, (value / SIGNAL_TOTAL) * 100);
  const band = bandFor(value);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-3">
        <AnimatedNumber
          value={value}
          className={`font-display font-light leading-none tabular-nums ${size === "lg" ? "text-5xl" : "text-3xl"}`}
        />
        {showBand ? (
          <motion.span
            key={band}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            Signal · {band}
          </motion.span>
        ) : (
          <span className="eyebrow text-ink-45">Signal</span>
        )}
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-canvas-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brass"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-line-strong"
            style={{ left: `${tick}%` }}
          />
        ))}
      </div>
      {showBand && (
        <div className="flex justify-between text-[0.65rem] uppercase tracking-wider text-ink-45">
          <span>0 Invisible</span>
          <span>250 Faint</span>
          <span>500 Present</span>
          <span>750 Recommended</span>
        </div>
      )}
    </div>
  );
}
