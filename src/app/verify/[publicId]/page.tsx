import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CertificateCard } from "@/components/CertificateCard";

export default async function VerifyPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const certificate = await db.certificate.findUnique({
    where: { publicId },
    include: { user: { include: { membership: { include: { campus: true, cohort: true } } } } },
  });
  if (!certificate) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
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
    </div>
  );
}
