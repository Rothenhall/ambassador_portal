import type { NextConfig } from "next";

// The Content-Security-Policy is set in src/middleware.ts, not here.
//
// It needs a per-request nonce to allow the App Router's own inline bootstrap scripts, which
// static config cannot produce. Nor may it live here *as well*: a response carrying two CSP
// headers is enforced as their intersection, so a second nonce-less policy would undo the
// nonce and blank the page again.

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Everything here is behind an invitation except the application form and a certificate
  // verify URL. Say it at the edge as well as in robots.txt, so a staging deploy cannot be
  // indexed by accident.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    const prod =
      process.env.NODE_ENV === "production"
        ? [
            // Two hours. Long enough to matter, short enough that a mistake here does not
            // take the site down for a month.
            { key: "Strict-Transport-Security", value: "max-age=7200; includeSubDomains" },
          ]
        : [];

    return [
      { source: "/(.*)", headers: [...SECURITY_HEADERS, ...prod] },
      {
        source: "/api/export/measurements",
        headers: [
          // A cached CSV would let one operator's browser serve another cohort's data.
          { key: "Cache-Control", value: "no-store, max-age=0" },
          ...SECURITY_HEADERS,
          ...prod,
        ],
      },
      {
        source: "/auth/callback",
        headers: [
          // A magic-link URL is a bearer token. It must not be cached, and the token must not
          // leak to whatever page the browser lands on next.
          { key: "Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          ...SECURITY_HEADERS,
          ...prod,
        ],
      },
    ];
  },
};

export default nextConfig;
