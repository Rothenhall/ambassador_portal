import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CertificateCard } from "@/components/CertificateCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  const certificate = await db.certificate.findUnique({
    where: { publicId },
    include: { user: { select: { name: true } } },
  });
  // Indexable on purpose: this is the URL an ambassador puts on a CV. The id is random, so
  // being listed costs nothing that guessing the id would not already cost.
  return certificate
    ? {
        title: `Campus Circle certificate — ${certificate.user.name}`,
        description: "Public verification of a Rothenhall Campus Circle certificate.",
        robots: { index: true, follow: false },
      }
    : { title: "Certificate not found", robots: { index: false } };
}

export default async function VerifyPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  if (!/^[A-Za-z0-9._-]{4,64}$/.test(String(publicId ?? ""))) notFound();
  const certificate = await db.certificate.findUnique({
    where: { publicId },
    include: { user: { include: { membership: { include: { campus: true, cohort: true } } } } },
  });
  if (!certificate) notFound();

  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <CertificateCard
        cohortLabel={`Campus Circle · ${certificate.user.membership?.cohort.name.split(",")[1]?.trim() ?? ""}`}
        name={certificate.user.name}
        avatarColor={certificate.user.avatarColor}
        campusName={certificate.user.membership?.campus.name ?? ""}
        assessmentScore={certificate.assessmentScore}
        issuedAt={certificate.issuedAt}
        publicId={certificate.publicId}
        revokedAt={certificate.revokedAt}
      />
    </main>
  );
}
