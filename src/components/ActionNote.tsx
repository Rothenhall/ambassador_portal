"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconCheck } from "@/components/icons";
import type { RunnerStatus } from "@/components/use-action-runner";

const ease = [0.22, 1, 0.36, 1] as const;

/** Inline outcome of a server action: the error in cognac, the confirmation in ink. */
export function ActionNote({ status, className = "" }: { status: RunnerStatus; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {status.kind === "error" && (
        <motion.p
          key="error"
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className={`rounded-sm2 border border-cognac/25 bg-cognac/[0.06] px-3 py-2 text-sm text-cognac-deep ${className}`}
        >
          {status.error}
        </motion.p>
      )}
      {status.kind === "done" && status.message && (
        <motion.p
          key="done"
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className={`inline-flex items-center gap-2 text-sm text-ink-60 ${className}`}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3f6b4a]/15 text-[#3f6b4a]">
            <IconCheck className="h-2.5 w-2.5" />
          </span>
          {status.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
