"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/Pill";
import { ActionButton } from "@/components/admin/ActionButton";
import { decideApplication } from "@/lib/actions/admin";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ApplicationsPanel({
  applications,
  canDecide,
}: {
  applications: AdminDashboardData["applications"];
  canDecide: boolean;
}) {
  // Accepting an application revalidates the panel and the row disappears with it. When mail
  // is not configured, the message is the invite URL itself, so it is hoisted out here and
  // kept until the operator dismisses it.
  const [notices, setNotices] = useState<{ id: string; text: string; error?: boolean }[]>([]);
  const note = (id: string) => (result: { ok: boolean; message?: string; error?: string }) => {
    const text = result.ok ? result.message : result.error;
    if (text) setNotices((prev) => [...prev.filter((n) => n.id !== id), { id, text, error: !result.ok }]);
  };

  const pending = applications.filter((a) => a.status === "pending");
  const decided = applications.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-5">
      {notices.length > 0 && (
        <div className="flex flex-col gap-2">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-sm2 border px-3.5 py-2.5 text-sm ${
                n.error ? "border-cognac/30 bg-cognac/[0.07] text-cognac-deep" : "border-line bg-paper text-ink-60"
              }`}
            >
              <p className="min-w-0 break-words">{n.text}</p>
              <button
                type="button"
                onClick={() => setNotices((prev) => prev.filter((x) => x.id !== n.id))}
                className="shrink-0 text-xs text-ink-45 hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pending.map((a) => (
          <div key={a.id} className="card flex flex-col gap-2.5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base">{a.name}</p>
                <p className="truncate text-xs text-ink-45">
                  <a href={`mailto:${a.email}`} className="border-0 text-cognac-deep hover:underline">
                    {a.email}
                  </a>
                </p>
                <p className="text-xs text-ink-45">
                  {a.campus}
                  {a.city ? ` · ${a.city}` : ""} · {a.field} · applied {relativeFromISO(a.createdAtISO)}
                </p>
              </div>
              <Pill status="pending" />
            </div>
            <p className="rounded-sm2 border border-line bg-canvas-2/40 p-2.5 text-sm text-ink-60">{a.answerText}</p>
            {canDecide ? (
              <div className="flex flex-wrap gap-2">
                <ActionButton action={() => decideApplication(a.id, "accepted")} label="Accept and send invite" onDone={note(a.id)} />
                <ActionButton
                  action={() => decideApplication(a.id, "rejected")}
                  label="Reject"
                  className="btn-ghost btn-sm"
                  onDone={note(a.id)}
                />
              </div>
            ) : (
              <p className="text-xs text-ink-45">Reviewers read applications; only a Campus Circle admin can decide them.</p>
            )}
          </div>
        ))}
        {pending.length === 0 && <p className="py-6 text-center text-sm text-ink-45">Nothing waiting.</p>}
      </div>

      {decided.length > 0 && (
        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Decided</p>
          <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
            {decided.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
                <span className="min-w-0 truncate text-ink-60">
                  {a.name} · {a.campus}
                  {a.provisioned ? " · account created" : ""}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {a.decidedISO && <span className="text-xs text-ink-45">{relativeFromISO(a.decidedISO)}</span>}
                  <Pill status={a.status} label={a.status === "accepted" ? "Accepted" : "Rejected"} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
