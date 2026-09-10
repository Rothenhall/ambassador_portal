"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconX } from "@/components/icons";

export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  right,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-30">
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-canvas shadow-2xl"
            initial={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                {eyebrow && (
                  <motion.p
                    key={eyebrow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="eyebrow truncate"
                  >
                    {eyebrow}
                  </motion.p>
                )}
                {title && (
                  <motion.h2
                    key={title}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-0.5 truncate font-display text-xl"
                  >
                    {title}
                  </motion.h2>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {right}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  onClick={onClose}
                  className="rounded-full p-1.5 text-ink-45 hover:bg-canvas-2 hover:text-ink"
                >
                  <IconX className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
            <motion.div
              className="flex-1 overflow-y-auto px-6 py-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
