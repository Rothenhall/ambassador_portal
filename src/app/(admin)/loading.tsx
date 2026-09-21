export default function AdminLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-cognac" />
      <p className="text-sm text-ink-45">Loading the operator console...</p>
    </div>
  );
}
