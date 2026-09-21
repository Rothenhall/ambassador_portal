import "server-only";
import { db } from "./db";
import type { Cohort } from "@prisma/client";

/** Adds or subtracts whole weeks from a date, keeping the time of day. */
export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function currentWeek(startsAt: Date, endsAt: Date, now = new Date()) {
  const totalWeeks = Math.round((endsAt.getTime() - startsAt.getTime()) / (7 * 86400000));
  const elapsed = Math.floor((now.getTime() - startsAt.getTime()) / (7 * 86400000)) + 1;
  return { week: Math.min(Math.max(elapsed, 1), totalWeeks), totalWeeks };
}

/**
 * The cohort new ambassadors are filed under. Chosen by start date rather than a status
 * flag, because a program running two overlapping cohorts is normal and an admin should not
 * have to remember to flip a switch.
 */
export async function activeCohort(): Promise<Cohort | null> {
  const now = new Date();
  const running = await db.cohort.findFirst({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
  });
  if (running) return running;
  const nextUp = await db.cohort.findFirst({
    where: { startsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
  });
  if (nextUp) return nextUp;
  return db.cohort.findFirst({ orderBy: { startsAt: "desc" } });
}

const AVATAR_COLORS = ["#9a7a4a", "#a85c30", "#5c6b52", "#3f5a6b", "#7a4f5c", "#6b5c7a", "#8a6f4e", "#4e6b64"];

/** Stable per-email colour, so the same person is the same colour everywhere. */
export function avatarColorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
