"use client";

import { motion } from "framer-motion";
import { fullDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Misc";
import { Wordmark, Mark } from "@/components/brand/Logo";

const ease = [0.22, 1, 0.36, 1] as const;

export function CertificateCard({
  cohortLabel,
  name,
  avatarColor,
  campusName,
  assessmentScore,
  issuedAt,
  publicId,
  revokedAt,
}: {
  cohortLabel: string;
  name: string;
  avatarColor: string;
  campusName: string;
  assessmentScore: number;
  issuedAt: Date;
  publicId: string;
  revokedAt: Date | null;
}) {
  const revoked = !!revokedAt;

  return (
    <div className="w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-center"
      >
        <Wordmark height={20} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative overflow-hidden rounded-xl2 border border-line-strong bg-paper p-10 text-center shadow-strong"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(-72deg, rgba(154,122,74,1) 0 1px, transparent 1px 30px)" }}
        />
        {/* Griffin watermark, per the house rule: large and faint. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]">
          <Mark size={260} tone="ink" />
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="eyebrow relative">
          {cohortLabel}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45, ease }}
          className="relative mt-3 font-display text-2xl"
        >
          Certificate of completion
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
          className="relative my-8 flex flex-col items-center gap-2"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 18 }}>
            <Avatar name={name} color={avatarColor} size={56} />
          </motion.div>
          <p className="font-display text-3xl">{name}</p>
          <p className="text-sm text-ink-45">{campusName}</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="relative text-sm text-ink-60"
        >
          Cleared the assessment on the house standard for AI visibility, with a score of{" "}
          <strong className="text-ink">{assessmentScore}/100</strong>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="relative mt-8 flex items-center justify-center gap-6 border-t border-line pt-6 text-xs text-ink-45"
        >
          <span>Issued {fullDate(issuedAt)}</span>
          <span className="font-mono">{publicId}</span>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className={`mt-6 text-center text-sm font-medium ${revoked ? "text-cognac-deep" : "text-[#3f6b4a]"}`}
      >
        {revoked ? `Revoked ${fullDate(revokedAt!)}` : "Verified, currently valid"}
      </motion.p>
    </div>
  );
}
