"use client";

import { motion, AnimatePresence } from "framer-motion";

const STYLES: Record<string, string> = {
  draft: "bg-canvas-2 text-ink-45 border-line-strong",
  submitted: "bg-brass/10 text-brass-deep border-brass/30",
  in_review: "bg-brass/10 text-brass-deep border-brass/30",
  accepted: "bg-[#3f6b4a]/10 text-[#3f6b4a] border-[#3f6b4a]/30",
  changes_requested: "bg-cognac/10 text-cognac-deep border-cognac/30",
  missed: "bg-ink-45/10 text-ink-45 border-ink-45/25",
  open: "bg-canvas-2 text-ink-60 border-line-strong",
  locked: "bg-canvas-2 text-ink-45 border-line",
  earned: "bg-brass/10 text-brass-deep border-brass/30",
  claimed: "bg-[#3f6b4a]/10 text-[#3f6b4a] border-[#3f6b4a]/30",
  fulfilled: "bg-[#3f6b4a]/10 text-[#3f6b4a] border-[#3f6b4a]/30",
  pending: "bg-brass/10 text-brass-deep border-brass/30",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  accepted: "Accepted",
  changes_requested: "Changes requested",
  missed: "Missed",
  open: "Open",
  locked: "Locked",
  earned: "Earned",
  claimed: "Claimed",
  fulfilled: "Fulfilled",
  pending: "Pending",
};

export function Pill({ status, label }: { status: string; label?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.75 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide ${
          STYLES[status] ?? "bg-canvas-2 text-ink-60 border-line-strong"
        }`}
      >
        {label ?? LABELS[status] ?? status}
      </motion.span>
    </AnimatePresence>
  );
}
