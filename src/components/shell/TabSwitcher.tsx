"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type Tab = { key: string; label: string; badge?: number; panel: ReactNode };

export function TabSwitcher({
  tabs,
  initial,
  active: activeProp,
  onChange,
  className = "",
  stickyTop = "top-0",
}: {
  tabs: Tab[];
  initial?: string;
  /** Pass active + onChange to control the tab from a parent (e.g. "jump to Review"). Omit for a self-contained tab bar. */
  active?: string;
  onChange?: (key: string) => void;
  className?: string;
  /** Where the tab bar parks when it sticks. Use "top-16" to clear a locked page header. */
  stickyTop?: string;
}) {
  const [internal, setInternal] = useState(initial && tabs.some((t) => t.key === initial) ? initial : tabs[0].key);
  const active = activeProp ?? internal;
  const setActive = onChange ?? setInternal;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || activeProp) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", active);
    window.history.replaceState(null, "", url);
  }, [active, activeProp]);

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className={className}>
      <div className={`sticky ${stickyTop} z-20 px-6 py-3`}>
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper/80 p-1 shadow-soft backdrop-blur-xl">
          {tabs.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className="relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.82rem] font-medium transition-colors duration-base"
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-ink shadow-soft"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                <span className={`relative transition-colors duration-base ${on ? "text-canvas" : "text-ink-60 hover:text-ink"}`}>
                  {t.label}
                </span>
                <AnimatePresence>
                  {!!t.badge && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`relative rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold leading-none ${
                        on ? "bg-canvas/25 text-canvas" : "bg-cognac text-white"
                      }`}
                    >
                      {t.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
        >
          {activeTab.panel}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
