/* eslint-disable @next/next/no-img-element */

/**
 * The real Rothenhall marks, from ../Assets/logos.
 *
 * The source PNGs are square lockups (griffin above the wordmark) on an opaque white
 * background, so two things happen here:
 *   1. `Mark` crops the griffin out of the square with a scaled, offset image in a clipped box.
 *   2. The white ground is keyed out with a blend mode rather than an alpha channel —
 *      `multiply` on light surfaces (white drops out, ink stays), and `invert + screen`
 *      on dark surfaces (inverted black ground drops out, the mark reads white).
 */

// Griffin occupies roughly x 0.36–0.65, y 0.25–0.56 of the square lockup.
const SCALE = 320; // % of the box
const OFFSET_X = -111.5; // %
const OFFSET_Y = -79.5; // %

const keyOut = (onDark: boolean): React.CSSProperties =>
  onDark ? { filter: "invert(1)", mixBlendMode: "screen" } : { mixBlendMode: "multiply" };

export function Mark({
  size = 30,
  onDark = false,
  tone = "brass",
  className = "",
}: {
  size?: number;
  onDark?: boolean;
  tone?: "brass" | "ink";
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={tone === "brass" ? "/brand/griffin-lockup.png" : "/brand/crest.png"}
        alt=""
        className="absolute max-w-none"
        style={{
          width: `${SCALE}%`,
          height: `${SCALE}%`,
          left: `${OFFSET_X}%`,
          top: `${OFFSET_Y}%`,
          ...keyOut(onDark),
        }}
      />
    </span>
  );
}

export function Wordmark({ height = 22, onDark = false, className = "" }: { height?: number; onDark?: boolean; className?: string }) {
  return (
    <img
      src="/brand/wordmark.png"
      alt="Rothenhall Partners"
      className={`w-auto object-contain ${className}`}
      style={{ height, ...keyOut(onDark) }}
    />
  );
}

/** Griffin mark + wordmark, side by side. The default app header lockup. */
export function LogoLockup({ height = 20, onDark = false }: { height?: number; onDark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark size={height + 12} onDark={onDark} />
      <Wordmark height={height} onDark={onDark} />
    </span>
  );
}

/** The full stacked lockup, for the sign-in hero and the certificate. */
export function FullLockup({ width = 200, onDark = false, className = "" }: { width?: number; onDark?: boolean; className?: string }) {
  return (
    <img
      src={onDark ? "/brand/griffin-lockup.png" : "/brand/crest.png"}
      alt="Rothenhall Partners"
      className={`object-contain ${className}`}
      style={{ width, ...keyOut(onDark) }}
    />
  );
}
