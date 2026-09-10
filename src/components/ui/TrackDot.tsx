import { TRACKS, type TrackKey } from "@/lib/signal";

const DOT: Record<TrackKey, string> = {
  A: "bg-brass",
  B: "bg-cognac",
  C: "bg-brass-deep",
  D: "bg-ink-60",
  E: "bg-cognac-deep",
};

export function TrackDot({ track, className = "" }: { track: TrackKey; className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[track]} ${className}`} />;
}

export function TrackLabel({ track }: { track: TrackKey }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-wider text-ink-45">
      <TrackDot track={track} />
      {TRACKS[track].name}
    </span>
  );
}
