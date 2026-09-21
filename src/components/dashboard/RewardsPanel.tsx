"use client";

import { motion } from "framer-motion";
import { Pill } from "@/components/ui/Pill";
import { RewardClaim } from "@/components/RewardClaim";
import { tierAtLeast, tierLabel } from "@/lib/signal";
import { IconGift, IconCheck } from "@/components/icons";
import type { AmbassadorDashboardData } from "@/lib/dashboard";

export function RewardsPanel({
  rewards,
  grants,
  tier,
  signalTotal,
  certificate,
}: {
  rewards: AmbassadorDashboardData["rewards"];
  grants: AmbassadorDashboardData["grants"];
  tier: string;
  signalTotal: number;
  certificate: { publicId: string; revoked: boolean } | null;
}) {
  const grantByReward = new Map(grants.map((g) => [g.rewardId, g]));

  return (
    <div className="flex flex-col gap-2 px-6 py-5">
      {rewards.map((r, i) => {
        const grant = grantByReward.get(r.id);
        const tierOk = tierAtLeast(tier, r.tierGate);
        const signalGap = Math.max(0, r.signalGate - signalTotal);
        // `earned` is a row written by the server (syncEarnedGrants), not something the panel
        // decides on the fly: this list explains the gate, it does not grant the reward.
        const status = grant?.status ?? "locked";
        const active = status !== "locked";

        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 rounded-sm2 border border-line bg-paper px-3.5 py-2.5"
          >
            <motion.div
              animate={active ? { scale: [0.7, 1.12, 1], rotate: [0, -8, 0] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                status === "locked" ? "bg-canvas-2 text-ink-45" : "bg-brass/10 text-brass-deep"
              }`}
            >
              {status === "fulfilled" || status === "claimed" ? <IconCheck className="h-4 w-4" /> : <IconGift className="h-4 w-4" />}
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium text-ink">{r.name}</p>
                <Pill status={status} />
              </div>
              <p className="truncate text-xs text-ink-45">
                {status === "locked"
                  ? [!tierOk && `${tierLabel(r.tierGate)} tier required`, signalGap > 0 && `${signalGap} Signal to go`].filter(Boolean).join(" and ")
                  : r.description}
              </p>
            </div>
            <div className="shrink-0">
              {status === "earned" && <RewardClaim rewardId={r.id} fulfilmentType={r.fulfilmentType} />}
              {r.code === "certificate" && status === "fulfilled" && certificate && (
                <a
                  href={`/verify/${certificate.publicId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-line text-xs font-medium text-cognac-deep"
                >
                  {certificate.revoked ? "Verify (revoked)" : "Verify"} &rarr;
                </a>
              )}
              {status === "claimed" && <span className="text-xs text-ink-45">Awaiting fulfilment</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
