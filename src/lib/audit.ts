import "server-only";
import { db } from "./db";
import { revalidatePath } from "next/cache";

// Append-only record of decisions about other people. Reviews already have their own table;
// this is for everything else that changes someone's standing: accepting an application,
// provisioning an account, granting or revoking a certificate, publishing a task.
export async function audit(opts: {
  actorId: string | null;
  action: string;
  target: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db.auditEvent.create({
      data: {
        actorId: opts.actorId,
        action: opts.action,
        target: opts.target,
        meta: (opts.meta ?? {}) as Record<string, never>,
        ip: opts.ip?.slice(0, 100) ?? null,
      },
    });
  } catch (e) {
    // An audit failure must not roll back the thing it is auditing, but it must be loud.
    console.error(`[audit] could not record ${opts.action} on ${opts.target}:`, e);
  }
}

// Both consoles are single pages behind a tab strip, so there are no per-section routes to
// revalidate. The previous code named six paths that do not exist and cached nothing.
export function revalidateAmbassador() {
  revalidatePath("/home");
}

export function revalidateAdmin() {
  revalidatePath("/admin");
}

export function revalidateConsoles() {
  revalidateAmbassador();
  revalidateAdmin();
}
