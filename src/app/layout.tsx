import type { Metadata } from "next";
import { Urbanist, Poppins } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-urbanist",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

// Indexing used to be off for the whole app, which also hid the one page that is meant to be
// public: the certificate verify URL an ambassador puts on their CV. Robots policy is now set
// per route (see src/app/robots.ts and the metadata exports in each segment).
export const metadata: Metadata = {
  title: {
    default: "Campus Circle",
    template: "%s · Campus Circle",
  },
  description: "Rothenhall Partners — Campus Circle ambassador program",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${urbanist.variable} ${poppins.variable}`}>
      {/*
        Grammarly and similar extensions stamp data-* attributes onto <body> before React
        hydrates, which React reports as an unpatchable hydration mismatch on every single
        load. Nothing here can stop them being added, and the mismatch is confined to this
        element's own attributes — suppressHydrationWarning does not cover the children, so a
        real mismatch inside the app still surfaces.
      */}
      <body className="min-h-screen bg-canvas font-sans text-ink" suppressHydrationWarning>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-canvas"
      >
        Skip to content
      </a>
        {children}
      </body>
    </html>
  );
}
