import type { Metadata } from "next";

// The application page is a client component, so it cannot export metadata itself.
export const metadata: Metadata = {
  title: "Apply to Campus Circle",
  description: "Rothenhall Partners — Campus Circle ambassador cohort. Twelve weeks, a rubric, work you own.",
  robots: { index: true, follow: false },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
