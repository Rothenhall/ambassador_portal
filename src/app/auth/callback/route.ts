import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicLink, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const INVALID = "/?link=invalid";

/**
 * Redeems a magic-link token for a session.
 *
 * A GET endpoint that logs someone in has to be honest about the ways it fails: an unknown,
 * expired, or already-used token all get the same flat message, and none of them say which.
 * Otherwise this page becomes a free oracle for "does this address have an account".
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = token ? await consumeMagicLink(token) : null;
  if (!email) return NextResponse.redirect(new URL(INVALID, req.url));

  const user = await db.user.findUnique({ where: { email }, include: { membership: { select: { id: true } } } });
  if (!user || user.status === "suspended") return NextResponse.redirect(new URL(INVALID, req.url));

  if (user.status === "invited") {
    await db.user.update({ where: { id: user.id }, data: { status: "active", lastSeenAt: new Date() } });
    await audit({ actorId: user.id, action: "auth.first_signin", target: user.id });
  } else {
    await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  }

  await createSession(user.id, req.headers.get("user-agent") ?? undefined);

  const target = user.role === "admin" || user.role === "reviewer" ? "/admin" : user.membership ? "/home" : "/apply";
  return NextResponse.redirect(new URL(target, req.url));
}
