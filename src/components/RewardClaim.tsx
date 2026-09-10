"use client";

import { useState, useTransition } from "react";
import { claimReward } from "@/lib/actions/rewards";

export function RewardClaim({ rewardId, fulfilmentType }: { rewardId: string; fulfilmentType: string }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [pending, startTransition] = useTransition();

  if (fulfilmentType === "shipped" && !open) {
    return (
      <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>
        Claim
      </button>
    );
  }

  if (fulfilmentType === "shipped" && open) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-64">
        <textarea
          className="input py-1.5 text-xs"
          rows={2}
          placeholder="Shipping address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          className="btn-primary btn-sm self-start"
          disabled={!address.trim() || pending}
          onClick={() => startTransition(async () => claimReward(rewardId, address.trim()))}
        >
          Confirm address
        </button>
      </div>
    );
  }

  return (
    <button className="btn-primary btn-sm" disabled={pending} onClick={() => startTransition(async () => claimReward(rewardId))}>
      {fulfilmentType === "scheduled" ? "Request" : "Claim"}
    </button>
  );
}
