"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IconCheck } from "@/components/icons";

export function SavedToast({ at }: { at: string | null }) {
  return (
    <AnimatePresence>
      {at && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="inline-flex items-center gap-1 text-xs text-ink-45"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#3f6b4a]/15 text-[#3f6b4a]"
          >
            <IconCheck className="h-2 w-2" />
          </motion.span>
          Saved at {at}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
