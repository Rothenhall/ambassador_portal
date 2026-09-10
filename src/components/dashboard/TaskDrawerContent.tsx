import { RubricPreview } from "@/components/ui/Rubric";
import { Pill } from "@/components/ui/Pill";
import { SubmissionForm } from "@/components/SubmissionForm";
import { SubmissionViewer } from "@/components/SubmissionViewer";
import { relativeTime, hoursSince, shortDate, fullDate } from "@/lib/format";
import { TRACKS, type TrackKey } from "@/lib/signal";
import type { DashTask } from "@/lib/dashboard";

export function TaskDrawerContent({ task }: { task: DashTask }) {
  const now = new Date();
  const opensAt = new Date(task.opensAt);
  const dueAt = new Date(task.dueAt);
  const locked = opensAt > now && task.attempts.length === 0;
  const isPastDue = dueAt < now;

  const latest = task.attempts[0];
  const history = task.attempts.slice(1);
  const showForm = !latest || latest.status === "draft" || latest.status === "changes_requested";

  if (locked) {
    return <p className="rounded-sm2 border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-45">This opens {fullDate(opensAt)}.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-45">
          <span className="text-brass-deep">{TRACKS[task.track as TrackKey].name}</span> · Week {task.week} · {task.signalValue} Signal
        </span>
        <span className="text-xs text-ink-45">Due {shortDate(dueAt)}</span>
      </div>

      <div className="flex flex-col gap-3 text-[0.92rem] leading-relaxed text-ink-80">
        {task.briefMd.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {isPastDue && showForm && (
        <div className="rounded-sm2 border border-cognac/25 bg-cognac/5 px-4 py-2.5 text-sm text-cognac-deep">
          This was due {shortDate(dueAt)}. Still worth submitting, late is better than not.
        </div>
      )}

      <div className="rounded-sm2 border border-line bg-canvas-2/40 p-4">
        <p className="eyebrow mb-2.5 !text-[0.6rem]">Rubric</p>
        <RubricPreview lines={task.rubric} />
      </div>

      {showForm ? (
        <div>
          {latest?.status === "changes_requested" && latest.feedbackMd && (
            <div className="mb-4 rounded-sm2 border border-cognac/25 bg-cognac/5 p-4 text-sm">
              <p className="mb-1 font-medium text-cognac-deep">Reviewer feedback, attempt {latest.attemptNo}</p>
              <p className="text-ink-60">{latest.feedbackMd}</p>
            </div>
          )}
          <SubmissionForm taskId={task.id} type={task.submissionType} config={task.config} initial={latest?.content} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-sm2 border border-line bg-paper p-4">
            <p className="mb-3 eyebrow !text-[0.6rem]">Your submission</p>
            <SubmissionViewer type={task.submissionType} config={task.config} content={latest.content} />
          </div>

          {(latest.status === "submitted" || latest.status === "in_review") && (
            <p className="text-sm text-ink-45">
              Submitted {relativeTime(latest.submittedAt ?? latest.createdAt)} · reviewed within 48 hours
              {hoursSince(latest.submittedAt ?? latest.createdAt) > 48 && <span className="ml-1 text-cognac-deep">, running a little behind on this one</span>}
            </p>
          )}

          {latest.status === "accepted" && (
            <div className="flex items-center gap-2 rounded-sm2 border border-[#3f6b4a]/25 bg-[#3f6b4a]/5 px-4 py-2.5 text-sm text-[#3f6b4a]">
              Accepted, +{task.signalValue} Signal
            </div>
          )}
          {latest.feedbackMd && latest.status === "accepted" && <p className="text-sm text-ink-60">&ldquo;{latest.feedbackMd}&rdquo;</p>}
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-line pt-4">
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Earlier attempts</p>
          <div className="flex flex-col gap-2.5">
            {history.map((h) => (
              <div key={h.id} className="rounded-sm2 border border-line bg-canvas-2/30 p-3 text-sm">
                <p className="mb-1 text-ink-45">
                  Attempt {h.attemptNo} · {relativeTime(h.submittedAt ?? h.createdAt)} · <Pill status={h.status} />
                </p>
                {h.feedbackMd && <p className="text-ink-60">{h.feedbackMd}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
