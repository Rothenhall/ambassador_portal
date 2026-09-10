"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function RubricPreview({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-2.5 text-sm text-ink-60"
        >
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[3px] border border-line-strong" />
          {line}
        </motion.li>
      ))}
    </ul>
  );
}

export function RubricChecklist({
  lines,
  value,
  onChange,
}: {
  lines: string[];
  value: boolean[];
  onChange: (next: boolean[]) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line, i) => {
        const checked = value[i] ?? false;
        return (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-60">
              <motion.button
                type="button"
                onClick={() => {
                  const next = [...value];
                  next[i] = !checked;
                  onChange(next);
                }}
                whileTap={{ scale: 0.85 }}
                animate={{
                  backgroundColor: checked ? "#9a7a4a" : "#fbf9f3",
                  borderColor: checked ? "#9a7a4a" : "#cbc0a9",
                  scale: checked ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border"
                aria-pressed={checked}
              >
                <AnimatePresence>
                  {checked && (
                    <motion.svg
                      viewBox="0 0 10 10"
                      className="h-2 w-2 text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.path
                        d="M1.5 5.2 3.8 7.5 8.5 2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.span animate={{ color: checked ? "#1a1712" : "#5c5648" }} transition={{ duration: 0.3 }}>
                {line}
              </motion.span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function useRubricState(count: number) {
  return useState<boolean[]>(() => Array(count).fill(false));
}
