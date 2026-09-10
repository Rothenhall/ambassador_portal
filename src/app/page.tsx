import { db } from "@/lib/db";
import { signInAs } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/Misc";
import { tierLabel } from "@/lib/signal";
import { FullLockup, Wordmark } from "@/components/brand/Logo";
import { SignInReveal, SignInRow } from "@/components/SignInReveal";

export default async function SignInPage() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { membership: { include: { campus: true } } },
  });

  const admins = users.filter((u) => u.role === "admin" || u.role === "reviewer");
  const ambassadors = users.filter((u) => u.role === "ambassador");

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

        <p className="relative text-xs text-canvas/35">circle.rothenhall.com · invite only</p>
      </div>

      {/* Sign in */}
      <div className="ground relative flex flex-col justify-center gap-7 px-8 py-12 sm:px-12">
        <div className="relative">
          <div className="lg:hidden">
            <FullLockup width={132} className="mb-6" />
          </div>
          <h2 className="font-display text-[1.75rem] font-bold tracking-tightest">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-60">
            Campus Circle accounts are issued by invitation. Choose your account to continue.
          </p>
        </div>

        <SignInReveal>
          <div>
            <p className="eyebrow mb-2.5">Operator</p>
            <div className="flex flex-col gap-1.5">
              {admins.map((u) => (
                <form key={u.id} action={signInAs.bind(null, u.id)}>
                  <SignInRow>
                    <Avatar name={u.name} color={u.avatarColor} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{u.name}</span>
                      <span className="block truncate text-xs capitalize text-ink-45">{u.role}</span>
                    </span>
                  </SignInRow>
                </form>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2.5">Ambassadors</p>
            <div className="flex max-h-[19rem] flex-col gap-1.5 overflow-y-auto pr-1">
              {ambassadors.map((u) => (
                <form key={u.id} action={signInAs.bind(null, u.id)}>
                  <SignInRow>
                    <Avatar name={u.name} color={u.avatarColor} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{u.name}</span>
                      <span className="block truncate text-xs text-ink-45">
                        {u.membership ? `${tierLabel(u.membership.tier)} · ${u.membership.campus.name}` : u.role}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-semibold text-ink-45">
                      {u.membership?.signalTotal ?? ""}
                    </span>
                  </SignInRow>
                </form>
              ))}
            </div>
          </div>
        </SignInReveal>
      </div>
    </div>
  );
}
