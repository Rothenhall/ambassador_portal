"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Misc";
import { TrackDot } from "@/components/ui/TrackDot";
import { RubricChecklist } from "@/components/ui/Rubric";
import { SubmissionViewer } from "@/components/SubmissionViewer";
import { reviewSubmission } from "@/lib/actions/submissions";
import type { TrackKey } from "@/lib/signal";
import { IconCheck, IconX } from "@/components/icons";

export type QueueItem = {
  id: string;
  attemptNo: number;
  ageHours: number;
  ambassador: { name: string; color: string; campus: string; lane: string };
  task: { code: string; title: string; track: string; submissionType: string; signalValue: number; config: any; rubric: string[] };
  content: any;
};

const CANNED_REASONS = [
  "The last rubric line isn't met yet, see the note",
  "Method or sample size needs to be stated more clearly",
  "Reads generic, needs a specific example or number",
  "Almost there, one small gap noted below",
];

const ease = [0.22, 1, 0.36, 1] as const;

export function ReviewQueueClient({ items: initial }: { items: QueueItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? null);
  const [rubricState, setRubricState] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState("");
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [confirmFlash, setConfirmFlash] = useState<"accepted" | "changes_requested" | "rejected" | null>(null);
  const [pending, startTransition] = useTransition();
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const selectedIndex = items.findIndex((i) => i.id === selectedId);

  useEffect(() => {
    setRubricState(selected ? Array(selected.task.rubric.length).fill(false) : []);
    setFeedback("");
    setMode("idle");
  }, [selectedId]);

  const allChecked = selected ? rubricState.length > 0 && rubricState.every(Boolean) : false;

  function advanceAfterDecision(id: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      const oldIndex = prev.findIndex((i) => i.id === id);
      const newSelected = next[Math.min(oldIndex, next.length - 1)];
      setSelectedId(newSelected?.id ?? null);
      return next;
    });
  }

  function decide(decision: "accepted" | "changes_requested" | "rejected") {
    if (!selected || pending) return;
    const id = selected.id;
    startTransition(async () => {
      await reviewSubmission(id, decision, rubricState, feedback || (decision === "accepted" ? "Clean. Nothing to add." : CANNED_REASONS[0]));
      router.refresh();
      setConfirmFlash(decision);
      setTimeout(() => {
        setConfirmFlash(null);
        advanceAfterDecision(id);
      }, 550);
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "j") setSelectedId((cur) => items[Math.min(items.findIndex((i) => i.id === cur) + 1, items.length - 1)]?.id ?? cur);
      if (e.key === "k") setSelectedId((cur) => items[Math.max(items.findIndex((i) => i.id === cur) - 1, 0)]?.id ?? cur);
      if (e.key === "a") decide("accepted");
      if (e.key === "c") {
        setMode("changes");
        setTimeout(() => feedbackRef.current?.focus(), 0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedId, rubricState, feedback]);

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
      >
        <p className="font-display text-xl text-ink-60">Queue clear</p>
        <p className="text-sm text-ink-45">Nothing waiting on review right now.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[19rem_1fr]">
      <div className="flex flex-col overflow-y-auto border-r border-line bg-canvas-2/40">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const active = item.id === selectedId;
            const old = item.ageHours > 48;
            return (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, x: 60, height: 0, transition: { duration: 0.3, ease } }}
                transition={{ duration: 0.3, ease }}
                onClick={() => setSelectedId(item.id)}
                className={`flex flex-col gap-1 overflow-hidden border-b border-line px-4 py-3 text-left transition-colors ${
                  active ? "bg-paper shadow-[inset_2px_0_0_#a85c30]" : "hover:bg-paper/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-ink">
                    <TrackDot track={item.task.track as TrackKey} />
                    {item.ambassador.name}
                  </span>
                  <span className={`text-[0.68rem] ${old ? "font-semibold text-cognac-deep" : "text-ink-45"}`}>{item.ageHours}h</span>
                </div>
                <span className="text-xs text-ink-45">
                  {item.task.code} · {item.task.title}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="relative flex min-h-0 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-6 py-4">
                <span className="flex items-center gap-2 font-display text-lg">
                  <Avatar name={selected.ambassador.name} color={selected.ambassador.color} size={26} />
                  {selected.ambassador.name}
                </span>
                <span className="eyebrow">
                  {selected.task.code} · Attempt {selected.attemptNo}
                </span>
                <span className="text-xs text-ink-45">
                  {selected.ambassador.campus} · {selected.ambassador.lane}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-5 px-6 py-5">
                <div className="rounded-sm2 border border-line bg-paper p-4">
                  <p className="eyebrow mb-3">Submission</p>
                  <SubmissionViewer type={selected.task.submissionType} config={selected.task.config} content={selected.content} />
                </div>

                <div>
                  <p className="eyebrow mb-2">Rubric</p>
                  <RubricChecklist lines={selected.task.rubric} value={rubricState} onChange={setRubricState} />
                </div>

                <AnimatePresence>
                  {mode === "changes" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <p className="eyebrow mb-2">Feedback</p>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {CANNED_REASONS.map((r) => (
                          <button key={r} onClick={() => setFeedback(r)} className="rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-60 hover:border-ink">
                            {r}
                          </button>
                        ))}
                      </div>
                      <textarea ref={feedbackRef} className="input" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 border-t border-line bg-canvas-2/30 px-6 py-4">
                <motion.button whileTap={{ scale: 0.96 }} className="btn-primary" disabled={!allChecked || pending} onClick={() => decide("accepted")}>
                  <IconCheck className="h-4 w-4" /> Accept · +{selected.task.signalValue}
                </motion.button>
                {mode === "changes" ? (
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost" disabled={!feedback.trim() || pending} onClick={() => decide("changes_requested")}>
                    Send changes requested
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost" onClick={() => setMode("changes")}>
                    Request changes
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.96 }} className="btn-danger-ghost" disabled={pending} onClick={() => decide("rejected")}>
                  <IconX className="h-4 w-4" /> Reject
                </motion.button>
                <span className="ml-auto font-mono text-xs text-ink-45">
                  {selectedIndex + 1} / {items.length} · J K move · A accept · C changes
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/85 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  confirmFlash === "accepted" ? "bg-[#3f6b4a]/10 text-[#3f6b4a]" : confirmFlash === "rejected" ? "bg-cognac-deep/10 text-cognac-deep" : "bg-cognac/10 text-cognac-deep"
                }`}
              >
                {confirmFlash === "rejected" ? <IconX className="h-7 w-7" /> : <IconCheck className="h-7 w-7" />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
