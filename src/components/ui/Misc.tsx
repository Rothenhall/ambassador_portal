export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-sm2 border border-dashed border-line-strong py-14 text-center">
      <p className="font-display text-lg text-ink-60">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-45">{body}</p>}
    </div>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-1">{children}</p>;
}

export function Divider() {
  return <div className="h-px w-full bg-line" />;
}
