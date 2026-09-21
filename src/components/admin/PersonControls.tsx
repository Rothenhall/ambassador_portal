"use client";

import { useState } from "react";
import { adjustSignal, revokeSessionsFor, sendSignInLinkFor, setMemberTier, setPersonPassword, setUserRole, setUserStatus } from "@/lib/actions/manage";
import { issueCertificateFor } from "@/lib/actions/manage";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";
import { Field, NumberInput, Select, TextInput } from "@/components/admin/fields";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

const TIERS = ["applicant", "ambassador", "senior", "campus_lead", "alumnus"];
const ROLES = ["ambassador", "reviewer", "admin"];

type Person = AdminDashboardData["ambassadors"][number];

/**
 * Everything an admin can do to one person, in the drawer that opens from their row.
 *
 * Each control is its own runner so "suspended" does not silence "signal adjusted", and every
 * one of these is a decision about a human being — they all write to the audit trail.
 */
export function PersonControls({ person, me }: { person: Person; me: { id: string; role: string } }) {
  const isAdmin = me.role === "admin";
  const isSelf = person.id === me.id;
  const tier = useActionRunner();
  const role = useActionRunner();
  const status = useActionRunner();
  const signal = useActionRunner();
  const link = useActionRunner();
  const cert = useActionRunner();
  const pass = useActionRunner();
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!isAdmin) {
    return <p className="text-xs text-ink-45">Reviewers read records. Only a Campus Circle admin can change one.</p>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-sm2 border border-line bg-canvas-2/40 p-3.5">
      <p className="eyebrow !text-[0.6rem]">Manage this account</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tier" hint={person.campusName}>
          <Select
            value={person.tier}
            onChange={(next) => void tier.run(() => setMemberTier(person.id, next))}
            options={TIERS.map((t) => ({ value: t, label: t.replace("_", " ") }))}
          />
        </Field>
        <Field label="Role" hint={isSelf ? "You cannot change your own role." : undefined}>
          <Select
            value={person.role ?? "ambassador"}
            disabled={isSelf}
            onChange={(next) => void role.run(() => setUserRole(person.id, next))}
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />
        </Field>
      </div>
      <ActionNote status={tier.status} />
      <ActionNote status={role.status} />

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-60">Standing</p>
        <div className="flex flex-wrap items-center gap-2">
          {person.status === "suspended" ? (
            <button className="btn-primary btn-sm" disabled={status.pending} onClick={() => void status.run(() => setUserStatus(person.id, "active"))}>
              Reinstate
            </button>
          ) : (
            <button
              className="btn-danger-ghost btn-sm"
              disabled={status.pending || isSelf}
              onClick={() => void status.run(() => setUserStatus(person.id, "suspended"))}
            >
              Suspend and sign out
            </button>
          )}
          <button className="btn-ghost btn-sm" disabled={link.pending} onClick={() => void link.run(() => sendSignInLinkFor(person.id))}>
            Send sign-in link
          </button>
          <button className="btn-ghost btn-sm" disabled={status.pending} onClick={() => void status.run(() => revokeSessionsFor(person.id))}>
            Revoke all sessions
          </button>
        </div>
        <ActionNote status={status.status} />
        <ActionNote status={link.status} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-60">Adjust Signal — {person.signalTotal} now</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Delta" className="sm:w-28">
            <NumberInput value={delta} onChange={setDelta} min={-2000} max={2000} />
          </Field>
          <Field label="Reason (goes in their ledger)" className="min-w-0 flex-1">
            <TextInput value={reason} onChange={setReason} placeholder="Work recognised from before enrolment" max={300} />
          </Field>
          <button
            className="btn-primary btn-sm shrink-0"
            disabled={signal.pending || delta === 0 || reason.trim().length < 5}
            onClick={() =>
              void signal.run(() => adjustSignal(person.id, { delta, reason: reason.trim() })).then((r) => {
                if (r?.ok) {
                  setDelta(0);
                  setReason("");
                }
              })
            }
          >
            Apply
          </button>
        </div>
        <ActionNote status={signal.status} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-60">Password</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="New password" className="min-w-[12rem] flex-1" hint="Leave blank to have one generated. Either way their sessions are signed out.">
            <TextInput value={newPassword} onChange={setNewPassword} placeholder="at least 10 characters" max={200} />
          </Field>
          <button
            className="btn-ghost btn-sm shrink-0"
            disabled={pass.pending}
            onClick={() =>
              void pass.run(() => setPersonPassword(person.id, newPassword)).then((r) => {
                if (r?.ok) setNewPassword("");
              })
            }
          >
            {pass.pending ? "Working..." : "Reset password"}
          </button>
        </div>
        <ActionNote status={pass.status} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-60">Certificate</p>
        {person.certificate ? (
          <p className="text-xs text-ink-45">
            {person.certificate.publicId} · {person.certificate.score}% · {person.certificate.revoked ? "revoked" : "issued"}
          </p>
        ) : (
          <button className="btn-ghost btn-sm" disabled={cert.pending} onClick={() => void cert.run(() => issueCertificateFor(person.id))}>
            Issue from their accepted assessment
          </button>
        )}
        <ActionNote status={cert.status} />
      </div>
    </div>
  );
}
