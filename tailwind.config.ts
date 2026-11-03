import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#140b2e",
          50: "#f6f4fb",
          100: "#ece8f7",
          200: "#d6cfee",
          300: "#b3a8dc",
          400: "#8a7cc3",
          500: "#6a5aa8",
          600: "#4f418a",
          700: "#3b2f6c",
          800: "#271d4d",
          900: "#140b2e",
        },
        brand: {
          violet: "#7c3aed",
          fuchsia: "#d946ef",
          pink: "#f43f5e",
          orange: "#fb923c",
          lime: "#a3e635",
          cyan: "#22d3ee",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #7c3aed 0%, #d946ef 45%, #fb923c 100%)",
        "brand-gradient-soft":
          "linear-gradient(120deg, rgba(124,58,237,0.12) 0%, rgba(217,70,239,0.12) 45%, rgba(251,146,60,0.12) 100%)",
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(217, 70, 239, 0.55)",
        card: "0 1px 2px rgba(20,11,46,0.04), 0 8px 24px -8px rgba(20,11,46,0.12)",
        "card-hover": "0 2px 4px rgba(20,11,46,0.05), 0 24px 48px -16px rgba(124,58,237,0.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.08)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        blob: "blob 14s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        shimmer: "shimmer 1.6s infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        pop: "pop 0.35s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
