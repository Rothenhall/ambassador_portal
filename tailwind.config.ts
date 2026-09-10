import type { Config } from "tailwindcss";

// Colour tokens are Rothenhall's own (../Assets/BRANDING.md).
// Radius / shadow / motion scale is modelled on the chatpress.heapvue.com reference:
// large soft-cornered panels, wide low-opacity shadows, tight heavy display type.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f3ea",
        "canvas-2": "#efe9dc",
        paper: "#fbf9f3",
        ink: "#1a1712",
        "ink-80": "#3a352c",
        "ink-60": "#5c5648",
        "ink-45": "#857d6c",
        line: "#ddd5c4",
        "line-strong": "#cbc0a9",
        brass: "#9a7a4a",
        "brass-deep": "#7c6238",
        "brass-soft": "#b79a6b",
        cognac: "#a85c30",
        "cognac-deep": "#8a4a26",
        "cognac-soft": "#c67c48",
        night: "#14120d",
        "night-2": "#201c15",
        "night-line": "#35301f",
        moss: "#3f6b4a",
      },
      fontFamily: {
        // Urbanist carries titles, subtitles and eyebrows; Poppins carries body/description copy.
        display: ["var(--font-urbanist)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
        tightest: "-0.04em",
        tighter2: "-0.03em",
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.22, 1, 0.36, 1)",
        soft: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      transitionDuration: {
        fast: "140ms",
        base: "200ms",
        slow: "260ms",
      },
      borderRadius: {
        sm2: "10px",
        lg2: "18px",
        xl2: "28px",
      },
      boxShadow: {
        soft: "0 6px 20px rgba(26,23,18,0.05)",
        card: "0 10px 30px rgba(26,23,18,0.06)",
        "card-hover": "0 14px 40px rgba(26,23,18,0.10)",
        medium: "0 16px 40px rgba(26,23,18,0.08)",
        strong: "0 24px 60px rgba(26,23,18,0.10)",
        ring: "inset 0 0 0 1px rgba(255,255,255,0.55)",
      },
      backgroundImage: {
        grid: "linear-gradient(90deg, rgba(26,23,18,0.035) 1px, transparent 0), linear-gradient(rgba(26,23,18,0.035) 1px, transparent 0)",
        dots: "radial-gradient(rgba(26,23,18,0.10) 1px, transparent 0)",
        "glow-top": "radial-gradient(circle at 50% 0%, rgba(154,122,74,0.14), transparent 58%)",
        "glow-cognac": "radial-gradient(circle at 15% 0%, rgba(168,92,48,0.10), transparent 45%)",
        frost: "linear-gradient(rgba(255,255,255,0.80), rgba(251,249,243,0.62))",
      },
      backgroundSize: {
        grid: "56px 56px",
        dots: "18px 18px",
      },
    },
  },
  plugins: [],
};

export default config;
