import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness and readiness in one unauthenticated endpoint.
 *
 * It answers the only two questions an orchestrator has — is the process up, and can it
 * reach the database — and deliberately reports nothing else. No row counts, no versions of
 * user data, no provider names, and the database error text never leaves the process,
 * because a connection string in an error message is exactly what a public endpoint
 * publishes.
 */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" = "ok";

  try {
    await db.$queryRaw<unknown[]>(Prisma.sql`SELECT 1`);
  } catch (e) {
    database = "error";
    console.error("[health] database unreachable:", e instanceof Error ? e.message : e);
  }

  const healthy = database === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
