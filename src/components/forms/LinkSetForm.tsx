"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { useState, useTransition } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";

export function LinkSetForm({
  taskId,
  rows,
  initial,
}: {
  taskId: string;
  rows: { key: string; label: string; placeholder: string }[];
  initial?: { rows?: { key: string; url: string }[] };
}) {
  const initialMap = new Map((initial?.rows ?? []).map((r) => [r.key, r.url]));
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.key, initialMap.get(r.key) ?? ""]))
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const filledCount = rows.filter((r) => values[r.key]?.trim()).length;
  const allValid = rows.every((r) => /^https?:\/\/.+\..+/.test((values[r.key] ?? "").trim()));

  function payload() {
    return { rows: rows.map((r) => ({ key: r.key, url: (values[r.key] ?? "").trim() })) };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
        {rows.map((r) => (
          <div key={r.key} className="flex flex-col gap-1.5 px-4 py-3">
            <label className="text-sm font-medium text-ink">{r.label}</label>
            <input
              className="input"
              placeholder={r.placeholder}
              value={values[r.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [r.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-45">
        {filledCount} of {rows.length} filled in
      </p>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!allValid || pending}
          onClick={() => startTransition(async () => submitTask(taskId, payload()))}
        >
          Submit
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveDraft(taskId, payload());
              setSavedAt(new Date().toLocaleTimeString());
            })
          }
        >
          Save draft
        </motion.button>
        <SavedToast at={savedAt} />
      </div>
    </div>
  );
}
