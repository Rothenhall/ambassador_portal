"use client";

import { useState } from "react";
import { setModuleComplete } from "@/lib/actions/library";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";
import { IconCheck } from "@/components/icons";
import type { AmbassadorDashboardData } from "@/lib/dashboard";

export function LibraryPanel({
  modules,
  completedIds,
  assessmentCode,
  onOpenAssessment,
}: {
  modules: AmbassadorDashboardData["modules"];
  completedIds: string[];
  assessmentCode: string | null;
  onOpenAssessment: (code: string) => void;
}) {
  const done = new Set(completedIds);
  const [openId, setOpenId] = useState<string | null>(null);
  const { run, status, pending } = useActionRunner();

  return (
    <div className="flex flex-col gap-3 px-6 py-5">
      <p className="text-sm text-ink-45">
        {modules.length} modules, self-paced. Clear them all before the assessment.
      </p>
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
        {modules.map((m, i) => {
          const isDone = done.has(m.id);
          return (
            <details key={m.id} className="group" open={openId === m.id}>
              <summary
                className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenId((cur) => (cur === m.id ? null : m.id));
                }}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${isDone ? "bg-[#3f6b4a]/10 text-[#3f6b4a]" : "bg-canvas-2 text-ink-45"}`}>
                  {isDone ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{m.title}</span>
                  <span className="block truncate text-xs text-ink-45">{m.summary}</span>
                </span>
              </summary>
              <div className="flex flex-col gap-3 px-3.5 pb-3.5 pl-[2.6rem] text-sm leading-relaxed text-ink-80">
                {m.bodyMd.split("\n\n").map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                <button
                  disabled={pending}
                  onClick={() => run(() => setModuleComplete(m.id, !isDone))}
                  className="btn-ghost btn-sm self-start"
                >
                  {isDone ? "Mark not complete" : "Mark complete"}
                </button>
                {openId === m.id && <ActionNote status={status} />}
              </div>
            </details>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-sm2 border border-line bg-canvas-2/40 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">{assessmentCode ? `${assessmentCode} · The assessment` : "The assessment"}</p>
          <p className="text-xs text-ink-45">
            {completedIds.length} of {modules.length} modules cleared
          </p>
        </div>
        {assessmentCode ? (
          <button onClick={() => onOpenAssessment(assessmentCode)} className="btn-ghost btn-sm shrink-0">
            Open
          </button>
        ) : (
          <span className="text-xs text-ink-45">Not open for your cohort yet.</span>
        )}
      </div>
    </div>
  );
}
