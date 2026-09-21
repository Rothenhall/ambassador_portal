"use client";

import type { ActionResult } from "@/lib/action-result";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";

/**
 * A button that owns its action result.
 *
 * Every operator action used to be a `<form action={serverAction.bind(...)}>`, which quietly
 * did nothing when the action returned a refusal — and after this pass, refusing is what those
 * actions do when something is wrong (someone else already graded it, the gate is unmet,
 * the session expired).
 */
export function ActionButton({
  action,
  label,
  pendingLabel = "Working...",
  className = "btn-primary btn-sm",
  onDone,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  pendingLabel?: string;
  className?: string;
  onDone?: (result: ActionResult<unknown>) => void;
}) {
  const { run, status, pending } = useActionRunner();
  return (
    <span className="inline-flex min-w-0 flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => run(action).then((result) => result && onDone?.(result))}
      >
        {pending ? pendingLabel : label}
      </button>
      <ActionNote status={status} className="!px-2 !py-1 !text-xs" />
    </span>
  );
}
