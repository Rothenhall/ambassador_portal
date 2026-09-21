import type { NextConfig } from "next";

// Content Security Policy, production only.
//
// In development Next injects an eval'd HMR runtime and the dev overlay, so shipping a real
// CSP there would break the tool you use to build the app. That also means a CSP verified only
// in dev is worth nothing, so this policy is checked against `next start` by
// `npm run verify:prod`, not against the dev server.
//
// style-src keeps 'unsafe-inline' deliberately: framer-motion writes an inline style attribute
// on nearly every animated node and the brand hero paints its grid and glow with one. Removing
// it would mean rewriting the motion layer to defend a vector (inline style authorship) that
// the app's own components produce. script-src has no unsafe-inline and no unsafe-eval.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
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
            { key: "Content-Security-Policy", value: CSP },
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
