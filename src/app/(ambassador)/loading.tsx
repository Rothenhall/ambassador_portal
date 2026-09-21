export default function AmbassadorLoading() {
  return (
    <div className="ground flex min-h-screen items-start justify-center pt-24">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-cognac" />
        <p className="text-sm text-ink-45">Loading your console...</p>
      </div>
    </div>
  );
}
