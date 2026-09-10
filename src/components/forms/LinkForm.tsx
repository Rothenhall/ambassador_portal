"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { useState, useTransition } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";
import { IconLink } from "@/components/icons";

export function LinkForm({
  taskId,
  label,
  placeholder,
  initial,
}: {
  taskId: string;
  label: string;
  placeholder: string;
  initial?: { url?: string; note?: string };
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const valid = /^https?:\/\/.+\..+/.test(url.trim());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
        <div className="relative">
          <IconLink className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-45" />
          <input
            className="input pl-9"
            placeholder={placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        {url && !valid && <p className="mt-1.5 text-xs text-cognac-deep">That does not look like a full URL yet.</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Note to the reviewer, optional</label>
        <textarea
          className="input"
          rows={2}
          placeholder="Anything we should know before we look"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!valid || pending}
          onClick={() =>
            startTransition(async () => {
              await submitTask(taskId, { url: url.trim(), note: note.trim() });
            })
          }
        >
          Submit
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveDraft(taskId, { url: url.trim(), note: note.trim() });
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
