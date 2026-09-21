import "server-only";
import crypto from "crypto";

// Password storage and checking.
//
// scrypt from node:crypto rather than a dependency: it is memory-hard, ships with the
// runtime, and the parameters are recorded inside the hash string so they can be raised
// later without a migration or a dual-verify window.
//
// The magic-link path is untouched — a null `passwordHash` simply means the account has no
// password and signs in by link, which is how invited people start until they set one.

const SCRYPT = "scrypt";
const N = 2 ** 15; // cost
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MIN_LENGTH = 10;
const MAX_LENGTH = 200;

// A handful of shapes that are not "weak" by length but are useless as secrets. Kept short
// on purpose: this is a floor, not a password-strength theatre.
const BLOCKED = new Set([
  "password10",
  "password12",
  "password123",
  "campuscircle",
  "campuscircle1",
  "circlecircle",
  "qwerty12345",
  "letmein12345",
]);

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(plain.normalize("NFKC"), salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 });
  return [SCRYPT, N, R, P, salt.toString("base64"), digest.toString("base64")].join("$");
}

/** Constant-time compare. A malformed or absent stored hash never verifies. */
export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== SCRYPT) return false;
  try {
    const [, n, r, p, saltB64, digestB64] = parts;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(digestB64, "base64");
    if (!salt.length || !expected.length) return false;
    const actual = crypto.scryptSync(plain.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 256 * 1024 * 1024,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Burned against a wrong password for addresses that have no password (or no account), so a
 * failed login takes the same time as a failed hash comparison and cannot be used to ask
 * "does this email exist, and does it have a password?".
 */
export const TIMING_EQUALISER_HASH = hashPassword("campus-circle-timing-equaliser-not-a-secret");

export function equalisingVerify(plain: string): false {
  verifyPassword(plain, TIMING_EQUALISER_HASH);
  return false;
}

/** Returns a reason to reject the password, or null when it is acceptable. */
export function passwordProblem(plain: string): string | null {
  const value = plain ?? "";
  if (value.length < MIN_LENGTH) return `Use at least ${MIN_LENGTH} characters.`;
  if (value.length > MAX_LENGTH) return `That is too long — ${MAX_LENGTH} characters maximum.`;
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return "Include at least one letter and one number.";
  if (/^(.)\1+$/.test(value)) return "That is one character repeated.";
  if (BLOCKED.has(value.toLowerCase())) return "That one is on the blocked list. Longer beats cleverer.";
  return null;
}

const LOOKALIKE_FREE_LETTERS = "abcdefghjkmnpqrstuvwxyz";
const LOOKALIKE_FREE_DIGITS = "23456789";

function pickFrom(alphabet: string, n: number): string[] {
  return Array.from(crypto.randomBytes(n)).map((b) => alphabet[b % alphabet.length]);
}

/**
 * Readable enough to dictate over chat, random enough to be a secret, and — unlike picking
 * from one mixed alphabet — guaranteed to satisfy passwordProblem(): a mixed draw can land
 * on fourteen letters with no digit in them, which is a password we would then reject.
 */
export function generatePassword(): string {
  const chars = [
    ...pickFrom(LOOKALIKE_FREE_LETTERS, 8),
    ...pickFrom(LOOKALIKE_FREE_DIGITS, 4),
    ...pickFrom(LOOKALIKE_FREE_LETTERS + LOOKALIKE_FREE_DIGITS, 2),
  ];
  // Fisher-Yates over the same entropy source, so the digit positions are not predictable.
  const shuffle = crypto.randomBytes(chars.length * 2);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = ((shuffle[i * 2] << 8) | shuffle[i * 2 + 1]) % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const text = chars.join("");
  return `${text.slice(0, 5)}-${text.slice(5, 10)}-${text.slice(10, 14)}`;
}
