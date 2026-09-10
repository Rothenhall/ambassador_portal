"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrackDot } from "@/components/ui/TrackDot";
import { Pill } from "@/components/ui/Pill";
import { shortDate, daysUntil } from "@/lib/format";
import type { TrackKey } from "@/lib/signal";
import type { DashTask } from "@/lib/dashboard";

const FILTERS = [
  { key: "action", label: "Needs action" },
  { key: "submitted", label: "In review" },
  { key: "accepted", label: "Accepted" },
  { key: "all", label: "All" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function TasksPanel({ tasks, week, onOpen }: { tasks: DashTask[]; week: number; onOpen: (code: string) => void }) {
  const [filter, setFilter] = useState("action");

  const highlights = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "accepted" && t.status !== "locked" && new Date(t.opensAt) <= new Date())
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 3),
    [tasks]
  );

  const filtered = tasks.filter((t) => {
    if (filter === "action") return ["open", "draft", "changes_requested", "missed"].includes(t.status);
    if (filter === "submitted") return ["submitted", "in_review"].includes(t.status);
    if (filter === "accepted") return t.status === "accepted";
    return true;
  });

  const byWeek = new Map<number, DashTask[]>();
  for (const t of filtered) byWeek.set(t.week, [...(byWeek.get(t.week) ?? []), t]);
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {highlights.length > 0 && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {highlights.map((t) => {
            const days = daysUntil(t.dueAt);
            const cta = t.status === "changes_requested" ? "Fix and resubmit" : t.status === "draft" ? "Continue" : ["submitted", "in_review"].includes(t.status) ? "View" : "Start";
            return (
              <motion.button
                key={t.id}
                variants={item}
                onClick={() => onOpen(t.code)}
                whileHover={{ y: -4, boxShadow: "0 10px 28px -14px rgba(26,23,18,.22)" }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="card flex flex-col gap-2 p-3.5 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-ink-45">
                    <TrackDot track={t.track as TrackKey} />
                    {t.code}
                  </span>
                  <Pill status={t.status} />
                </div>
                <p className="font-display text-[1.05rem] leading-snug">{t.title}</p>
                <div className="mt-auto flex items-center justify-between pt-1 text-xs text-ink-45">
                  <span>{t.signalValue} Signal · {days >= 0 ? `due ${shortDate(t.dueAt)}` : "self-paced"}</span>
                  <span className="font-medium text-cognac-deep">{cta}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative rounded-full border-0 px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
              filter === f.key ? "text-canvas" : "text-ink-60 hover:text-ink"
            }`}
          >
            {filter === f.key && (
              <motion.span
                layoutId="filter-active-bg"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-2"
        >
          {weeks.length === 0 && <p className="py-8 text-center text-sm text-ink-45">Nothing matches this filter.</p>}
          {weeks.map((wk, wi) => {
            const items = byWeek.get(wk)!;
            return (
              <motion.details
                key={wk}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wi * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                open={wk === week || filter !== "all"}
                className="group rounded-sm2 border border-line bg-paper"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`font-display text-[0.95rem] ${wk === week ? "text-cognac-deep" : "text-ink"}`}>Week {wk}</span>
                    {wk === week && <span className="eyebrow !text-[0.58rem] text-cognac-deep">Current</span>}
                  </span>
                  <span className="text-xs text-ink-45">
                    {items.filter((t) => t.status === "accepted").length}/{items.length} accepted
                  </span>
                </summary>
                <div className="flex flex-col divide-y divide-line border-t border-line">
                  {items.map((t) => (
                    <motion.button
                      key={t.id}
                      onClick={() => onOpen(t.code)}
                      whileHover={{ backgroundColor: "rgba(239,233,220,0.5)" }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-3 px-3.5 py-2 text-left text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <TrackDot track={t.track as TrackKey} />
                        <span className="text-ink-45">{t.code}</span>
                        <span className="truncate text-ink">{t.title}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-ink-45">{t.signalValue} Signal</span>
                        <Pill status={t.status} />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.details>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
