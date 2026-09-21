"use client";

import { useState } from "react";
import { claimReward } from "@/lib/actions/rewards";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";

export function RewardClaim({ rewardId, fulfilmentType }: { rewardId: string; fulfilmentType: string }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const { run, status, pending } = useActionRunner();

  if (fulfilmentType === "shipped" && !open) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <button className="btn-primary btn-sm" disabled={pending} onClick={() => setOpen(true)}>
          Claim
        </button>
        <ActionNote status={status} className="!max-w-[16rem] text-right" />
      </div>
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
          disabled={address.trim().length < 10 || pending}
          onClick={() => run(() => claimReward(rewardId, address.trim()))}
        >
          {pending ? "Claiming..." : "Confirm address"}
        </button>
        <ActionNote status={status} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        className="btn-primary btn-sm"
        disabled={pending}
        onClick={() => run(() => claimReward(rewardId))}
      >
        {pending ? "Claiming..." : fulfilmentType === "scheduled" ? "Request" : "Claim"}
      </button>
      <ActionNote status={status} className="!max-w-[16rem]" />
    </div>
  );
}
