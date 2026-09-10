import { Pill } from "@/components/ui/Pill";
import { decideApplication } from "@/lib/actions/admin";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ApplicationsPanel({ applications }: { applications: AdminDashboardData["applications"] }) {
  const pending = applications.filter((a) => a.status === "pending");
  const decided = applications.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-5">
      <div className="flex flex-col gap-3">
        {pending.map((a) => (
          <div key={a.id} className="card flex flex-col gap-2.5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base">{a.name}</p>
                <p className="text-xs text-ink-45">
                  {a.campus} · {a.field} · applied {relativeFromISO(a.createdAtISO)}
                </p>
              </div>
              <Pill status="pending" />
            </div>
            <p className="rounded-sm2 border border-line bg-canvas-2/40 p-2.5 text-sm text-ink-60">{a.answerText}</p>
            <div className="flex gap-2">
              <form action={decideApplication.bind(null, a.id, "accepted")}>
                <button className="btn-primary btn-sm">Accept</button>
              </form>
              <form action={decideApplication.bind(null, a.id, "rejected")}>
                <button className="btn-ghost btn-sm">Reject</button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="py-6 text-center text-sm text-ink-45">Nothing waiting.</p>}
      </div>

      {decided.length > 0 && (
        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Decided</p>
          <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
            {decided.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3.5 py-2 text-sm">
                <span className="text-ink-60">
                  {a.name} · {a.campus}
                </span>
                <Pill status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
