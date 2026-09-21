"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { ActionNote } from "@/components/ActionNote";
import { useActionRunner } from "@/components/use-action-runner";
import { useMemo, useState } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function DocumentForm({
  taskId,
  minWords,
  maxWords,
  placeholder,
  initial,
}: {
  taskId: string;
  minWords: number;
  maxWords: number;
  placeholder: string;
  initial?: { body?: string };
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const { run, status, pending } = useActionRunner();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const words = useMemo(() => wordCount(body), [body]);
  const inRange = words >= minWords && words <= maxWords;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="input min-h-[16rem] font-sans leading-relaxed"
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between text-xs">
        <span className={inRange ? "text-[#3f6b4a]" : "text-ink-45"}>
          {words} words
        </span>
        <span className="text-ink-45">
          {minWords} to {maxWords} words
        </span>
      </div>

      <ActionNote status={status} />

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!inRange || pending}
          onClick={() => run(() => submitTask(taskId, { body, wordCount: words }))}
        >
          Submit
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const r = await saveDraft(taskId, { body, wordCount: words });
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
