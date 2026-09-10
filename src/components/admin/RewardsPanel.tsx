import { Avatar } from "@/components/ui/Misc";
import { Pill } from "@/components/ui/Pill";
import { fulfillGrant } from "@/lib/actions/rewards";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function AdminRewardsPanel({ grants }: { grants: AdminDashboardData["rewardGrants"] }) {
  const toFulfil = grants.filter((g) => g.status === "claimed");
  const fulfilled = grants.filter((g) => g.status === "fulfilled");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-5">
      <div>
        <p className="eyebrow mb-2.5 !text-[0.6rem]">Fulfilment queue</p>
        <div className="flex flex-col gap-2.5">
          {toFulfil.map((g) => (
            <div key={g.id} className="card flex items-center gap-3.5 p-3.5">
              <Avatar name={g.userName} color={g.userColor} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{g.rewardName}</p>
                <p className="truncate text-xs text-ink-45">
                  {g.userName} · claimed {relativeFromISO(g.createdAtISO)}
                  {g.detail && ` · ${g.detail}`}
                </p>
              </div>
              <form action={fulfillGrant.bind(null, g.id)}>
                <button className="btn-primary btn-sm">Mark fulfilled</button>
              </form>
            </div>
          ))}
          {toFulfil.length === 0 && <p className="py-4 text-center text-sm text-ink-45">Nothing waiting on fulfilment.</p>}
        </div>
      </div>

      {fulfilled.length > 0 && (
        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Fulfilled</p>
          <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
            {fulfilled.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-3.5 py-2 text-sm">
                <span className="text-ink-60">
                  {g.userName} · {g.rewardName}
                </span>
                <Pill status="fulfilled" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
