import { TrackDot } from "@/components/ui/TrackDot";
import { ActionButton } from "@/components/admin/ActionButton";
import type { TrackKey } from "@/lib/signal";
import { setTaskPublished } from "@/lib/actions/admin";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function shortDateISO(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function AdminTasksPanel({
  tasks,
  canPublish,
  canEdit,
  onEdit,
}: {
  tasks: AdminDashboardData["tasks"];
  canPublish: boolean;
  canEdit: boolean;
  onEdit: (taskId: string | null) => void;
}) {
  return (
    <div className="px-6 py-5">
      {canEdit && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-45">{tasks.length} tasks in this cohort. Ambassadors only ever see published ones.</p>
          <button className="btn-primary btn-sm" onClick={() => onEdit(null)}>
            New task
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-sm2 border border-line bg-paper">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-[0.62rem] uppercase tracking-wider text-brass-deep">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Week</th>
              <th className="px-4 py-2 font-medium">Window</th>
              <th className="px-4 py-2 font-medium text-right">Signal</th>
              <th className="px-4 py-2 font-medium text-right">Accepted</th>
              <th className="px-4 py-2 font-medium text-right">Open</th>
              <th className="px-4 py-2 font-medium">Published</th>
              {canEdit && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-canvas-2/40">
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <TrackDot track={t.track as TrackKey} />
                    {t.code}
                  </span>
                </td>
                <td className="px-4 py-2 text-ink-60">{t.title}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-45">{t.submissionType}</td>
                <td className="px-4 py-2 text-ink-60">{t.week}</td>
                <td className="px-4 py-2 text-xs text-ink-45">
                  {shortDateISO(t.opensAtISO)} to {shortDateISO(t.dueAtISO)}
                </td>
                <td className="px-4 py-2 text-right text-ink-60">{t.signalValue}</td>
                <td className="px-4 py-2 text-right text-ink-60">{t.accepted}</td>
                <td className="px-4 py-2 text-right text-ink-60">{t.inReview}</td>
                <td className="px-4 py-2">
                  {canPublish ? (
                    <ActionButton
                      action={() => setTaskPublished(t.id, !t.published)}
                      label={t.published ? "Live · hide" : "Hidden · publish"}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${
                        t.published ? "bg-[#3f6b4a]/10 text-[#3f6b4a]" : "bg-canvas-2 text-ink-45"
                      }`}
                    />
                  ) : (
                    <span className={`text-xs ${t.published ? "text-[#3f6b4a]" : "text-ink-45"}`}>{t.published ? "Live" : "Hidden"}</span>
                  )}
                </td>
                {canEdit && (
                  <td className="px-4 py-2">
                    <button className="text-xs font-medium text-cognac-deep hover:underline" onClick={() => onEdit(t.id)}>
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-xs text-ink-45">
        Tasks with submissions against them keep their code and submission format frozen — that is what ambassadors&apos; work is
        filed under. Everything else stays editable.
      </p>
    </div>
  );
}
