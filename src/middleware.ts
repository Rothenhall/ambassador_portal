import { NextResponse, type NextRequest } from "next/server";

// Edge layer: session redirects and the Content-Security-Policy. Not a security boundary for
// authorization.
//
// The token in the cookie is an opaque handle whose hash lives in Postgres, and the edge
// runtime cannot reach Postgres — so the redirect here only asks "is there a cookie at all" to
// send obvious strangers to the sign-in page without a full render. Authorization is
// decided in the layouts and pages, which every request reaches anyway:
//   src/app/(ambassador)/layout.tsx, src/app/(admin)/layout.tsx and both page.tsx files.
// A forged cookie with no Session row passes through here and is rejected there.
//
// Why the CSP lives here and not in next.config: the App Router inlines a handful of
// bootstrap and flight-payload <script> tags into every document. A policy of
// `script-src 'self'` with no nonce blocks exactly those, and the result is not a broken
// feature but a blank page — the streamed HTML is never placed. A nonce must differ per
// request, which static config cannot do, so the policy is built here. Next reads the nonce
// back off the *request* header it is handed and stamps its own inline scripts with it; the
// same value goes out as the response header.
//
// 'strict-dynamic' is load-bearing rather than decoration: client-side navigation inserts
// chunk <script> elements at runtime, and once a nonce or hash is present a browser ignores
// host allowances like 'self' for scripts, so those chunks would be blocked without it.
// This still allows no unsafe-inline and no unsafe-eval for scripts.
//
// Development is left without a CSP on purpose — Next injects an eval'd HMR runtime and the
// dev overlay there, so enforcing a real policy in dev breaks the tool used to build the app.
// That also means this policy is only ever true of a production server, so it is checked
// against `next start` by `npm run verify:prod`, not against the dev server.

const SESSION_COOKIE = "cc_session";
const PROTECTED = ["/home", "/admin"];
const PROD = process.env.NODE_ENV === "production";

function cspWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // style-src keeps 'unsafe-inline' deliberately: framer-motion writes an inline style
    // attribute on nearly every animated node and the brand hero paints its grid and glow
    // with one. Removing it would mean rewriting the motion layer to defend a vector (inline
    // style authorship) that the app's own components produce.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const stranger = !hasSessionCookie && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // 32 hex characters. crypto.randomUUID is available in the edge runtime.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = cspWithNonce(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("content-security-policy", csp);

  const res = stranger
    ? NextResponse.redirect(new URL("/", req.url))
    : NextResponse.next({ request: { headers: requestHeaders } });

  if (PROD) res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Documents only. Static chunks, images and icons need no policy of their own: the document
  // that loads them carries it, and its script-src governs those subresources.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)"],
};
