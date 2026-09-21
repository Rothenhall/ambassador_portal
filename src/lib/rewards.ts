import "server-only";
import { db } from "./db";
import { tierAtLeast } from "./signal";

// Reward state, written by the server.
//
// `earned` used to exist only inside the render: the panel computed eligibility from tier
// and Signal on every paint, so the database never recorded when a reward became available
// and a claim could be filed for something that had never been earned. Now the ladder is
// materialised as a real row the moment it is satisfied, and claiming checks that row.

export type SyncResult = { newlyEarned: number };

export async function syncEarnedGrants(userId: string): Promise<SyncResult> {
  const membership = await db.membership.findUnique({ where: { userId } });
  if (!membership) return { newlyEarned: 0 };

  const [rewards, grants] = await Promise.all([
    db.reward.findMany(),
    db.rewardGrant.findMany({ where: { userId } }),
  ]);

  const byReward = new Map(grants.map((g) => [g.rewardId, g]));
  const create: { userId: string; rewardId: string; status: "earned"; earnedAt: Date }[] = [];
  const upgrade: string[] = [];

  for (const reward of rewards) {
    const eligible = tierAtLeast(membership.tier, reward.tierGate) && membership.signalTotal >= reward.signalGate;
    if (!eligible) continue;
    const grant = byReward.get(reward.id);
    if (!grant) create.push({ userId, rewardId: reward.id, status: "earned", earnedAt: new Date() });
    else if (grant.status === "locked") upgrade.push(grant.id);
    // claimed / fulfilled are decisions with a history; never walk them backwards.
  }

  if (!create.length && !upgrade.length) return { newlyEarned: 0 };

  await db.$transaction([
    ...(create.length
      ? [db.rewardGrant.createMany({ data: create, skipDuplicates: true })]
      : []),
    ...(upgrade.length
      ? [db.rewardGrant.updateMany({ where: { id: { in: upgrade }, status: "locked" }, data: { status: "earned", earnedAt: new Date() } })]
      : []),
  ]);

  return { newlyEarned: create.length + upgrade.length };
}

export function canClaim(opts: {
  tier: string;
  signalTotal: number;
  tierGate: string;
  signalGate: number;
}) {
  if (!tierAtLeast(opts.tier, opts.tierGate)) return "not_your_tier";
  if (opts.signalTotal < opts.signalGate) return "below_signal";
  return null;
}
