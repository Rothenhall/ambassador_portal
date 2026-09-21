"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[campus-circle] render error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md rounded-sm2 border border-line bg-paper p-6 shadow-soft">
        <p className="eyebrow mb-2 !text-[0.6rem] text-cognac-deep">Something broke</p>
        <h1 className="font-display text-xl">This screen could not be drawn.</h1>
        <p className="mt-2 text-sm text-ink-60">
          Nothing you did caused it, and nothing was half-saved: writes on this app either complete or say they did not.
          Try again, and if it repeats, send the reference below to your campus lead.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-ink-45">ref {error.digest}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={reset} className="btn-primary btn-sm">
            Try again
          </button>
          <Link href="/" className="btn-ghost btn-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
