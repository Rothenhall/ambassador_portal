"use client";

import { useActionState } from "react";
import { changeOwnPassword, type PasswordState } from "@/lib/actions/profile";

/**
 * Set or change your own password. Works the same on the ambassador console and the operator
 * console; the server decides whether a current password is required, based on whether the
 * account already has one.
 */
export function PasswordForm({ hasPassword, email }: { hasPassword: boolean; email: string }) {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changeOwnPassword, { ok: false });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-xs text-ink-45">
        {hasPassword
          ? "Signing in by password or by emailed link — both work, and neither is weaker than the other."
          : "You have only ever signed in by link. Set a password if you would rather type one."}
      </p>

      {hasPassword && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-60">Current password</span>
          <input name="current" type="password" autoComplete="current-password" className="input" required />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-60">New password</span>
        <input
          name="next"
          type="password"
          autoComplete={hasPassword ? "new-password" : "username-new-password"}
          className="input"
          minLength={10}
          maxLength={200}
          required
          placeholder="At least 10 characters, one letter and one number"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-60">Repeat it</span>
        <input name="confirm" type="password" autoComplete="new-password" className="input" required />
      </label>

      <div className="flex flex-col gap-2">
        <button type="submit" className="btn-primary btn-sm self-start" disabled={pending}>
          {pending ? "Saving..." : hasPassword ? "Change password" : "Set password"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-cognac-deep">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p role="status" className="text-sm text-ink-60">
            {state.message}
          </p>
        )}
        <p className="text-[0.7rem] text-ink-45">Signed in as {email}</p>
      </div>
    </form>
  );
}
