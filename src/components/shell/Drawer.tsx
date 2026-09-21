"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconX } from "@/components/icons";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const restoreTo = useRef<HTMLElement | null>(null);

  // Escape closes. This was already here; the focus work below is what was missing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // A slide-over that does not take focus is worse than useless to a keyboard or screen-reader
  // user: the panel appears, focus stays behind the scrim, and Tab walks the page underneath.
  // So: remember where focus was, move into the panel, keep Tab inside it, and put focus back
  // on the way out — which is the row or card the person opened it from.
  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const focusables = panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    (focusables.find((el) => el.dataset.autofocus !== undefined) ?? focusables[0] ?? panel)?.focus();

    function onKeyCap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyCap);
    return () => {
      document.removeEventListener("keydown", onKeyCap);
      if (restoreTo.current?.isConnected) restoreTo.current.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-30">
          <motion.div
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : (eyebrow ?? "Panel")}
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-canvas shadow-2xl outline-none"
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
                    id={titleId}
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
                  aria-label="Close panel"
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
