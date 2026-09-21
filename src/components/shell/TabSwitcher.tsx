"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type Tab = { key: string; label: string; badge?: number; panel: ReactNode };

export function TabSwitcher({
  tabs,
  initial,
  active: activeProp,
  onChange,
  className = "",
  stickyTop = "top-0",
  label = "Sections",
}: {
  tabs: Tab[];
  initial?: string;
  /** Pass active + onChange to control the tab from a parent (e.g. "jump to Review"). Omit for a self-contained tab bar. */
  active?: string;
  onChange?: (key: string) => void;
  className?: string;
  /** Where the tab bar parks when it sticks. Use "top-16" to clear a locked page header. */
  stickyTop?: string;
  /** Name for the tab group, announced with each tab. */
  label?: string;
}) {
  const [internal, setInternal] = useState(initial && tabs.some((t) => t.key === initial) ? initial : tabs[0].key);
  const active = activeProp ?? internal;
  const setActive = onChange ?? setInternal;
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || activeProp) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", active);
    window.history.replaceState(null, "", url);
  }, [active, activeProp]);

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  // A row of buttons that behaves like tabs has to be operable like tabs: arrow keys move
  // between them, Tab leaves the group, and only the selected one is in the tab order.
  function onKey(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(tabs[next].key);
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  }

  return (
    <div className={className}>
      <div className={`sticky ${stickyTop} z-20 px-6 py-3`}>
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-paper/80 p-1 shadow-soft backdrop-blur-xl"
        >
          {tabs.map((t, i) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                id={`${baseId}-tab-${t.key}`}
                aria-selected={on}
                aria-controls={`${baseId}-panel-${active}`}
                aria-label={t.badge ? `${t.label}, ${t.badge} waiting` : t.label}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(t.key)}
                onKeyDown={(e) => onKey(e, i)}
                className="relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.82rem] font-medium transition-colors duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cognac"
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    aria-hidden="true"
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
                      aria-hidden="true"
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
          role="tabpanel"
          id={`${baseId}-panel-${active}`}
          aria-labelledby={`${baseId}-tab-${active}`}
          tabIndex={0}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          className="outline-none"
        >
          {activeTab.panel}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
