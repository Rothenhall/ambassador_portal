"use client";

import { motion } from "framer-motion";
import { SavedToast } from "@/components/motion/SavedToast";
import { useMemo, useState, useTransition } from "react";
import { saveDraft, submitTask } from "@/lib/actions/submissions";
import { IconCheck } from "@/components/icons";

type Question = { prompt: string; options: string[]; correctIndex: number };

export function QuizForm({
  taskId,
  questions,
  practicalPrompt,
  initial,
}: {
  taskId: string;
  questions: Question[];
  practicalPrompt?: string;
  initial?: { answers?: number[]; practicalText?: string };
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    initial?.answers?.length ? initial.answers : Array(questions.length).fill(null)
  );
  const [practicalText, setPracticalText] = useState(initial?.practicalText ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const answered = answers.filter((a) => a !== null).length;
  const score = useMemo(
    () => questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0),
    [answers, questions]
  );
  const practicalOk = !practicalPrompt || practicalText.trim().length >= 60;
  const ready = answered === questions.length && practicalOk;

  function payload() {
    return { answers: answers.map((a) => a ?? -1), practicalText, autoScore: score };
  }

  return (
    <div className="flex flex-col gap-5">
      {questions.map((q, i) => (
        <div key={i} className="rounded-sm2 border border-line bg-paper p-4">
          <p className="mb-3 text-sm font-medium text-ink">
            {i + 1}. {q.prompt}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex cursor-pointer items-center gap-2.5 rounded-sm2 border px-3 py-2 text-sm transition-colors ${
                  answers[i] === oi ? "border-cognac bg-cognac/5 text-ink" : "border-line text-ink-60 hover:border-line-strong"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    answers[i] === oi ? "border-cognac bg-cognac" : "border-line-strong"
                  }`}
                >
                  {answers[i] === oi && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <input
                  type="radio"
                  className="hidden"
                  checked={answers[i] === oi}
                  onChange={() => setAnswers((a) => a.map((v, j) => (j === i ? oi : v)))}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {practicalPrompt && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">{practicalPrompt}</label>
          <textarea className="input min-h-[10rem]" value={practicalText} onChange={(e) => setPracticalText(e.target.value)} />
          <p className="mt-1 text-xs text-ink-45">{practicalText.trim().length} characters, minimum 60</p>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-sm2 bg-canvas-2 px-3.5 py-2.5 text-sm text-ink-60">
        {score === questions.length && answered === questions.length ? (
          <IconCheck className="h-4 w-4 text-[#3f6b4a]" />
        ) : null}
        {answered} of {questions.length} answered
        {answered === questions.length && ` · ${score}/${questions.length} correct so far`}
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          disabled={!ready || pending}
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
