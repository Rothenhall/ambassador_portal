"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { ActionNote } from "@/components/ActionNote";
import { useActionRunner } from "@/components/use-action-runner";
import { useState } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";
import { IconPlus, IconX } from "@/components/icons";

type Field = { key: string; label: string; type: "text" | "textarea" };
type Row = Record<string, string>;

function emptyRow(fields: Field[]): Row {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

export function RosterForm({
  taskId,
  fields,
  minRows,
  initial,
}: {
  taskId: string;
  fields: Field[];
  minRows: number;
  initial?: { rows?: Row[] };
}) {
  const [rows, setRows] = useState<Row[]>(
    initial?.rows?.length ? initial.rows : Array.from({ length: Math.min(2, minRows) }, () => emptyRow(fields))
  );
  const { run, status, pending } = useActionRunner();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const complete = rows.filter((r) => fields.every((f) => r[f.key]?.trim())).length;
  const ready = complete >= minRows;

  function update(i: number, key: string, value: string) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="relative rounded-sm2 border border-line bg-paper p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow !text-[0.62rem]">Entry {i + 1}</span>
              <button
                className="rounded-full p-1 text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-ink-60">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea className="input" rows={2} value={row[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} />
                  ) : (
                    <input className="input" value={row[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cognac-deep hover:text-cognac-deep/70"
          onClick={() => setRows((rs) => [...rs, emptyRow(fields)])}
        >
          <IconPlus className="h-4 w-4" /> Add entry
        </button>
        <span className={`text-xs ${ready ? "text-[#3f6b4a]" : "text-ink-45"}`}>
          {complete} of {minRows} minimum complete
        </span>
      </div>

      <ActionNote status={status} />

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!ready || pending}
          onClick={() => run(() => submitTask(taskId, { rows }))}
        >
          Submit
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = await saveDraft(taskId, { rows });
              if (r.ok) setSavedAt(new Date().toLocaleTimeString());
              return r;
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
