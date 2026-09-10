"use client";

import { Avatar } from "@/components/ui/Misc";
import { tierLabel } from "@/lib/signal";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function AmbassadorsPanel({ ambassadors, onOpen }: { ambassadors: AdminDashboardData["ambassadors"]; onOpen: (id: string) => void }) {
  return (
    <div className="px-6 py-5">
      <div className="overflow-hidden rounded-sm2 border border-line bg-paper">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-[0.62rem] uppercase tracking-wider text-brass-deep">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Campus</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium text-right">Signal</th>
              <th className="px-4 py-2 font-medium text-right">Accepted/submitted</th>
              <th className="px-4 py-2 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {ambassadors.map((u) => (
              <tr
                key={u.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(u.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(u.id);
                  }
                }}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas-2/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cognac focus-visible:-outline-offset-2"
              >
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2.5">
                    <Avatar name={u.name} color={u.avatarColor} size={24} />
                    <span className="font-medium text-ink">{u.name}</span>
                    {u.atRisk && <span className="rounded-full bg-cognac/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-cognac-deep">at risk</span>}
                  </span>
                </td>
                <td className="px-4 py-2 text-ink-60">{u.campusName}</td>
                <td className="px-4 py-2 text-ink-60">{tierLabel(u.tier)}</td>
                <td className="px-4 py-2 text-right font-medium text-ink">{u.signalTotal}</td>
                <td className="px-4 py-2 text-right text-ink-60">
                  {u.acceptedCount}/{u.submittedCount}
                </td>
                <td className="px-4 py-2 text-ink-45">{relativeFromISO(u.lastActiveISO)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
