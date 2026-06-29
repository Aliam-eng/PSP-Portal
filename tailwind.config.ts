import type { Config } from "tailwindcss";

// Design tokens distilled from giv.trade: deep teal-black canvas, brand green
// with a neon-green glow accent, gold + danger, Plus Jakarta Sans, soft glow.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#03100f",
        surface: {
          DEFAULT: "#0a1413",
          raised: "#0e1a18",
          overlay: "#13201e",
        },
        line: {
          DEFAULT: "#1c2a27",
          strong: "#273a36",
        },
        ink: {
          DEFAULT: "#f3faf6",
          muted: "#8ba097",
          dim: "#5a6b65",
        },
        brand: {
          DEFAULT: "#00c24a",
          600: "#009937",
          500: "#00c24a",
          400: "#28d36c",
          neon: "#39ff14",
          ink: "#02140a",
        },
        gold: "#efbc2a",
        danger: "#e63946",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(57,255,20,0.08), 0 18px 50px -22px rgba(0,153,55,0.45)",
        "glow-sm": "0 6px 22px -10px rgba(0,194,74,0.65)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 24px 50px -30px rgba(0,0,0,0.85)",
        focus: "0 0 0 3px rgba(0,194,74,0.22)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
