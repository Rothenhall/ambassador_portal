// Every server action returns one of these instead of throwing.
//
// The previous version called `requireUser()` inside actions and let the error fly, while
// the callers wrapped the call in `startTransition` with no catch. The result was a silent
// no-op button plus an unhandled rejection in the log — a reviewer could not tell a saved
// decision from a failed one. Now the outcome is data, and the UI shows it.

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string };

export const ok = <T,>(data?: T, message?: string): ActionResult<T> => ({ ok: true, data, message });
export const fail = (error: string): ActionResult<undefined> => ({ ok: false, error });

export const EXPIRED_SESSION = "Your session has expired. Sign in again.";
