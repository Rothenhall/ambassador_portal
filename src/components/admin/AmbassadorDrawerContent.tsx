import { Avatar } from "@/components/ui/Misc";
import { SignalMeter } from "@/components/ui/SignalMeter";
import { Pill } from "@/components/ui/Pill";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

export function AmbassadorDrawerContent({ ambassador }: { ambassador: AdminDashboardData["ambassadors"][number] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar name={ambassador.name} color={ambassador.avatarColor} size={44} />
        <div className="min-w-0">
          <p className="text-sm text-ink-45">
            {ambassador.campusName} · {ambassador.email}
          </p>
          {ambassador.lane && <p className="text-sm text-ink-60">{ambassador.lane}</p>}
        </div>
      </div>

      <SignalMeter value={ambassador.signalTotal} showBand />

      <div>
        <p className="eyebrow mb-2 !text-[0.6rem]">Submissions</p>
        <div className="flex max-h-48 flex-col divide-y divide-line overflow-y-auto rounded-sm2 border border-line bg-paper">
          {ambassador.submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="truncate text-ink-60">
                <strong className="text-ink">{s.code}</strong> {s.title}
              </span>
              <Pill status={s.status} />
            </div>
          ))}
          {ambassador.submissions.length === 0 && <p className="px-3 py-3 text-sm text-ink-45">No submissions yet.</p>}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2 !text-[0.6rem]">Signal ledger</p>
        <div className="flex max-h-40 flex-col divide-y divide-line overflow-y-auto rounded-sm2 border border-line bg-paper">
          {ambassador.ledger.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span className="text-ink-60">{l.taskCode}</span>
              <span className="font-medium text-[#3f6b4a]">+{l.delta}</span>
            </div>
          ))}
          {ambassador.ledger.length === 0 && <p className="px-3 py-3 text-sm text-ink-45">Nothing recorded yet.</p>}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2 !text-[0.6rem]">Rewards</p>
        <div className="flex flex-col gap-1.5">
          {ambassador.grants.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-xs">
              <span className="text-ink-60">{g.rewardName}</span>
              <Pill status={g.status} />
            </div>
          ))}
          {ambassador.grants.length === 0 && <p className="text-xs text-ink-45">Nothing granted yet.</p>}
        </div>
      </div>
    </div>
  );
}
