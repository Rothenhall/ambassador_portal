import { Avatar } from "@/components/ui/Misc";
import { ActionButton } from "@/components/admin/ActionButton";
import { PersonControls } from "@/components/admin/PersonControls";
import { revokeCertificateAction } from "@/lib/actions/rewards";
import { SignalMeter } from "@/components/ui/SignalMeter";
import { Pill } from "@/components/ui/Pill";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

export function AmbassadorDrawerContent({
  ambassador,
  canAdmin,
  me,
}: {
  ambassador: AdminDashboardData["ambassadors"][number];
  canAdmin: boolean;
  me: { id: string; role: string };
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={ambassador.name} color={ambassador.avatarColor} size={44} />
          <div className="min-w-0">
            <p className="font-display text-base text-ink">{ambassador.name}</p>
            <p className="text-sm text-ink-45">
              {ambassador.campusName} · {ambassador.email}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-45">
              <Pill status={ambassador.status} />
              <span className="capitalize">{String(ambassador.tier).replace("_", " ")}</span>
            </p>
            {ambassador.lane && <p className="text-sm text-ink-60">{ambassador.lane}</p>}
          </div>
        </div>
        <a
          href={`/admin/ambassadors/${ambassador.id}/letter`}
          target="_blank"
          rel="noreferrer"
          className="link-line shrink-0 border-0 text-xs font-medium text-cognac-deep"
        >
          Appointment letter &rarr;
        </a>
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
        <p className="eyebrow mb-2 !text-[0.6rem]">Certificate</p>
        {ambassador.certificate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm2 border border-line bg-paper px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <a
                href={`/verify/${ambassador.certificate.publicId}`}
                target="_blank"
                rel="noreferrer"
                className="border-0 font-mono text-xs text-cognac-deep hover:underline"
              >
                {ambassador.certificate.publicId}
              </a>
              <p className="text-xs text-ink-45">
                {ambassador.certificate.score}% · issued {new Date(ambassador.certificate.issuedISO).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {ambassador.certificate.revoked ? " · revoked" : ""}
              </p>
            </div>
            {!ambassador.certificate.revoked && canAdmin && <RevokeButton userId={ambassador.id} />}
          </div>
        ) : (
          <p className="text-sm text-ink-45">Not issued. It comes from fulfilling the certificate reward, and needs a passed assessment first.</p>
        )}
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

      {canAdmin && <PersonControls person={ambassador} me={me} />}
    </div>
  );
}

function RevokeButton({ userId }: { userId: string }) {
  return (
    <ActionButton
      label="Revoke"
      className="btn-danger-ghost btn-sm"
      action={() => revokeCertificateAction(userId, window.prompt("Why is this certificate being revoked? It shows on the public verify page.") ?? "")}
    />
  );
}
