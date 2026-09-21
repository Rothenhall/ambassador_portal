import { db } from "@/lib/db";
import { devSignInEnabled } from "@/lib/auth";
import { tierLabel } from "@/lib/signal";
import { FullLockup, Wordmark } from "@/components/brand/Logo";
import { SignInPanel, type DevAccount } from "@/components/SignInPanel";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;

  // The old page rendered every account in the roster as a one-click session, in every
  // environment, for anyone who found the URL. The list is now built only when dev sign-in
  // is actually enabled, and dev sign-in is refused server-side outside a local dev server.
  let devAccounts: DevAccount[] = [];
  if (devSignInEnabled()) {
    const users = await db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { membership: { include: { campus: true } } },
    });
    devAccounts = users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      tier: u.membership ? tierLabel(u.membership.tier) : null,
      campus: u.membership?.campus.name ?? null,
      signal: u.membership?.signalTotal ?? null,
      avatarColor: u.avatarColor,
    }));
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_27rem]">
      {/* Editorial hero */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-night px-14 py-12 text-canvas lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(90deg, rgba(183,154,107,1) 1px, transparent 0), linear-gradient(rgba(183,154,107,1) 1px, transparent 0)", backgroundSize: "56px 56px" }}
        />
        <div
          className="pointer-events-none absolute -left-40 top-1/4 h-[42rem] w-[42rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(168,92,48,0.30), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(154,122,74,0.28), transparent 70%)" }}
        />
        <Wordmark height={20} onDark className="relative" />

        <div className="relative flex max-w-lg flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cognac-soft" />
            <span className="eyebrow !text-[0.6rem] text-brass-soft">Campus Circle · Cohort 01</span>
          </span>
          <h1 className="text-[clamp(2.6rem,4.4vw,3.9rem)] font-bold leading-[1.02] tracking-tightest text-canvas">
            Twelve weeks.
            <br />
            One rubric.
            <br />
            <span className="text-cognac-soft">Your name in the proof.</span>
          </h1>
          <p className="max-w-md text-[0.98rem] leading-relaxed text-canvas/60">
            Build one thing you own, learn a discipline most working marketers do not have yet, and publish five
            pieces under your own name. Everything is graded against a rubric you can read before you start.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            {["A certificate that verifies publicly", "A byline on rothenhall.com", "A letter that names your work"].map((c) => (
              <span key={c} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-canvas/70">
                {c}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-canvas/35">campusscout.rothenhall.com · invite only</p>
      </div>

      {/* Sign in */}
      <main id="main" className="ground relative flex flex-col justify-center gap-7 px-8 py-12 sm:px-12">
        <div className="lg:hidden">
          <FullLockup width={132} className="mb-6" />
        </div>
        <SignInPanel devAccounts={devAccounts} notice={link === "invalid" ? "invalid" : null} />
      </main>
    </div>
  );
}
