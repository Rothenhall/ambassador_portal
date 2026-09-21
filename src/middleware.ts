import { NextResponse, type NextRequest } from "next/server";

// Edge redirect layer, not a security boundary.
//
// The token in the cookie is an opaque handle whose hash lives in Postgres, and the edge
// runtime cannot reach Postgres — so middleware here only asks "is there a cookie at all" to
// send obvious strangers to the sign-in page without a full render. Authorization is
// decided in the layouts and pages, which every request reaches anyway:
//   src/app/(ambassador)/layout.tsx, src/app/(admin)/layout.tsx and both page.tsx files.
// A forged cookie with no Session row passes through here and is rejected there.

const SESSION_COOKIE = "cc_session";
const PROTECTED = ["/home", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSessionCookie && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/admin/:path*"],
};
