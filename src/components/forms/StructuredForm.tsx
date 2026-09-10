"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { useState, useTransition } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";
import { IconPlus, IconX } from "@/components/icons";

type Column = { key: string; label: string; type: "text" | "select" | "textarea"; options?: string[] };
type Row = Record<string, string>;

function emptyRow(columns: Column[]): Row {
  return Object.fromEntries(columns.map((c) => [c.key, c.type === "select" ? c.options?.[0] ?? "" : ""]));
}

export function StructuredForm({
  taskId,
  columns,
  minRows,
  initial,
}: {
  taskId: string;
  columns: Column[];
  minRows: number;
  initial?: { rows?: Row[] };
}) {
  const [rows, setRows] = useState<Row[]>(
    initial?.rows?.length ? initial.rows : Array.from({ length: Math.min(3, minRows) }, () => emptyRow(columns))
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const filledRows = rows.filter((r) => Object.values(r).some((v) => v?.trim())).length;
  const ready = filledRows >= minRows;

  function update(i: number, key: string, value: string) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-sm2 border border-line">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="bg-canvas-2">
              {columns.map((c) => (
                <th key={c.key} className="border-b border-line px-3 py-2 text-left text-[0.65rem] font-medium uppercase tracking-wider text-brass-deep">
                  {c.label}
                </th>
              ))}
              <th className="w-8 border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-1.5 align-top">
                    {c.type === "select" ? (
                      <select
                        className="input py-1.5"
                        value={row[c.key] ?? ""}
                        onChange={(e) => update(i, c.key, e.target.value)}
                      >
                        {c.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : c.type === "textarea" ? (
                      <textarea
                        className="input py-1.5"
                        rows={2}
                        value={row[c.key] ?? ""}
                        onChange={(e) => update(i, c.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className="input py-1.5"
                        value={row[c.key] ?? ""}
                        onChange={(e) => update(i, c.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1">
                  <button
                    className="rounded-full p-1.5 text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cognac-deep hover:text-cognac"
          onClick={() => setRows((rs) => [...rs, emptyRow(columns)])}
        >
          <IconPlus className="h-4 w-4" /> Add row
        </button>
        <span className={`text-xs ${ready ? "text-[#3f6b4a]" : "text-ink-45"}`}>
          {filledRows} of {minRows} minimum rows filled
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!ready || pending}
          onClick={() => startTransition(async () => submitTask(taskId, { rows }))}
        >
          Submit
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveDraft(taskId, { rows });
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
