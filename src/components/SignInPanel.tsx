"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { passwordSignIn, requestSignInLink, devSignInAs, type SignInState } from "@/lib/actions/auth";
import { SignInReveal, SignInRow } from "@/components/SignInReveal";
import { Avatar } from "@/components/ui/Misc";

export type DevAccount = {
  id: string;
  name: string;
  role: string;
  tier: string | null;
  campus: string | null;
  signal: number | null;
  avatarColor: string;
};

export function SignInPanel({
  devAccounts = [],
  notice,
}: {
  devAccounts?: DevAccount[];
  notice?: "invalid" | null;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(requestSignInLink, { ok: true });
  const [passwordState, passwordAction, passwordPending] = useActionState<SignInState, FormData>(passwordSignIn, { ok: true });
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"password" | "link">("password");
  // React resets uncontrolled form fields once a form action settles, so the address is held in
  // state: nobody should have to retype their email after one wrong password.
  const [loginEmail, setLoginEmail] = useState("");

  return (
    <div className="relative flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[1.75rem] font-bold tracking-tightest">Sign in</h2>
        <p className="mt-1.5 text-sm text-ink-60">
          Campus Circle accounts are issued by invitation. Sign in with your password, or have a link emailed
          that works once.
        </p>
      </div>

      {notice === "invalid" && (
        <p className="rounded-sm2 border border-cognac/30 bg-cognac/[0.07] px-3.5 py-2.5 text-sm text-cognac-deep">
          That link is expired or already used. Request a fresh one, or use your password.
        </p>
      )}

      <div className="inline-flex items-center gap-1 self-start rounded-full border border-line bg-paper/80 p-1">
        {(["password", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-colors ${
              mode === m ? "bg-ink text-canvas" : "text-ink-60 hover:text-ink"
            }`}
          >
            {m === "password" ? "Password" : "Email me a link"}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form action={passwordAction} className="flex flex-col gap-2.5">
          <label className="eyebrow !text-[0.6rem] text-ink-45" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="input"
            placeholder="you@college.edu"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <label className="eyebrow !text-[0.6rem] text-ink-45" htmlFor="login-password">
            Password
          </label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required className="input" />
          <button type="submit" className="btn-primary self-start" disabled={passwordPending}>
            {passwordPending ? "Checking..." : "Sign in"}
          </button>
          {passwordState.error && (
            <p className="text-sm text-cognac-deep" role="alert">
              {passwordState.error}
            </p>
          )}
        </form>
      ) : (
      <form action={formAction} className="flex flex-col gap-2.5">
        <label className="eyebrow !text-[0.6rem] text-ink-45" htmlFor="signin-email">
          Email on your invitation
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@college.edu"
        />
        <button type="submit" className="btn-primary self-start" disabled={pending}>
          {pending ? "Sending link..." : "Email me a sign-in link"}
        </button>

        {state.error ? (
          <p className="text-sm text-cognac-deep" role="alert">
            {state.error}
          </p>
        ) : state.message ? (
          <p className="text-sm text-ink-60" role="status">
            {state.message}
          </p>
        ) : null}
      </form>
      )}

      <p className="text-xs text-ink-45">
        Not in the cohort yet?{" "}
        <Link href="/apply" className="link-line font-medium text-cognac-deep hover:underline">
          Apply for Cohort 02
        </Link>
      </p>

      {devAccounts.length > 0 && (
        <details className="rounded-sm2 border border-line bg-paper/60 px-3.5 py-3">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-ink-45">
            Development only · continue as
          </summary>
          <SignInReveal>
            <div>
              <p className="eyebrow mb-2.5">Operator</p>
              <div className="flex flex-col gap-1.5">
                {devAccounts
                  .filter((u) => u.role === "admin" || u.role === "reviewer")
                  .map((u) => (
                    <form key={u.id} action={devSignInAs.bind(null, u.id)}>
                      <SignInRow>
                        <Avatar name={u.name} color={u.avatarColor} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{u.name}</span>
                          <span className="block truncate text-xs capitalize text-ink-45">{u.role}</span>
                        </span>
                      </SignInRow>
                    </form>
                  ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2.5">Ambassadors</p>
              <div className="flex max-h-[19rem] flex-col gap-1.5 overflow-y-auto pr-1">
                {devAccounts
                  .filter((u) => u.role === "ambassador")
                  .map((u) => (
                    <form key={u.id} action={devSignInAs.bind(null, u.id)}>
                      <SignInRow>
                        <Avatar name={u.name} color={u.avatarColor} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{u.name}</span>
                          <span className="block truncate text-xs text-ink-45">
                            {u.tier ? `${u.tier} · ${u.campus}` : u.role}
                          </span>
                        </span>
                        <span className="shrink-0 font-display text-sm font-semibold text-ink-45">{u.signal ?? ""}</span>
                      </SignInRow>
                    </form>
                  ))}
              </div>
            </div>
          </SignInReveal>
        </details>
      )}
    </div>
  );
}
