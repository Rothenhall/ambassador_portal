import "server-only";
import { headers } from "next/headers";

// Fixed-window counter per process, keyed by IP + action.
//
// Deliberately modest: this stops one visitor hammering the public form or requesting a
// thousand sign-in links, which is the whole point on a single-instance deploy. It is not
// a distributed limiter — if this ever runs on more than one box, move the buckets to Redis
// and keep this interface.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const PRUNE_ABOVE = 5000;

function prune(now: number) {
  if (buckets.size < PRUNE_ABOVE) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type RateCheck = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateCheck {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, remaining: limit - bucket.count };
}

/** Best-effort caller identity for rate limiting: forwarded IP, else the socket-ish fallback. */
export async function clientKey(scope: string): Promise<string> {
  let ip = "unknown";
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) ip = fwd.split(",")[0]!.trim();
    else ip = h.get("x-real-ip") ?? "unknown";
  } catch {
    // headers() is unavailable outside a request context (scripts, build-time); don't block.
  }
  return `${scope}:${ip}`.slice(0, 160);
}

export const LIMITS = {
  apply: { limit: 5, windowMs: 60 * 60_000 },
  magicLink: { limit: 6, windowMs: 10 * 60_000 },
  passwordLogin: { limit: 8, windowMs: 10 * 60_000 },
  devSignIn: { limit: 30, windowMs: 10 * 60_000 },
  claim: { limit: 20, windowMs: 10 * 60_000 },
  submission: { limit: 40, windowMs: 10 * 60_000 },
} as const;
