"use client";

import { useCallback, useState } from "react";
import type { ActionResult } from "@/lib/action-result";

export type RunnerStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "done"; message?: string }
  | { kind: "error"; error: string };

/**
 * One place that turns an ActionResult into UI state.
 *
 * The previous pattern was `startTransition(async () => await someAction())` with no result
 * handling: a rejected decision, an expired session or a validation miss looked exactly like
 * a success, because the action threw into a transition React had already forgotten about.
 */
export function useActionRunner() {
  const [status, setStatus] = useState<RunnerStatus>({ kind: "idle" });

  const run = useCallback(async <T,>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T> | null> => {
    setStatus({ kind: "pending" });
    try {
      const result = await fn();
      setStatus(result.ok ? { kind: "done", message: result.message } : { kind: "error", error: result.error });
      return result;
    } catch (e) {
      console.error("[action] unexpected failure", e);
      setStatus({ kind: "error", error: "Something broke on our side. Nothing was saved — try again." });
      return null;
    }
  }, []);

  const clear = useCallback(() => setStatus({ kind: "idle" }), []);

  return { status, run, clear, pending: status.kind === "pending" };
}
