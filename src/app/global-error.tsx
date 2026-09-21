"use client";

/**
 * Last-resort boundary. It replaces the root <html>, so it cannot rely on the root layout,
 * Tailwind classes, or fonts — everything here is inline and boring on purpose.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f7f3ea", color: "#1c1a17", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "28rem", margin: "0 auto", padding: "4rem 1.5rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#a85c30", margin: 0 }}>
            Campus Circle
          </p>
          <h1 style={{ fontSize: "1.5rem", margin: "0.6rem 0 0.5rem" }}>This screen could not be drawn.</h1>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "#5f5a52", margin: 0 }}>
            Nothing you did caused it. Try again, and if it repeats, send the reference below to your campus lead.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.78rem", color: "#9c968c", marginTop: "0.75rem" }}>
              ref {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", border: 0, borderRadius: 999, background: "#a85c30", color: "#fff", padding: "0.6rem 1.1rem", fontSize: "0.9rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
