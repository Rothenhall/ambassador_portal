import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow mb-2 !text-[0.6rem] text-ink-45">404</p>
        <h1 className="font-display text-2xl">Nothing at this address.</h1>
        <p className="mt-2 text-sm text-ink-60">
          The page is gone, or it was never part of Campus Circle. If you followed a link from an email, it may have
          expired rather than disappeared.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary btn-sm">
            Sign in
          </Link>
          <Link href="/apply" className="btn-ghost btn-sm">
            Apply to the cohort
          </Link>
        </div>
      </div>
    </div>
  );
}
