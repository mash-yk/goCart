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
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#181715",
          50: "#FAF8F3",
          100: "#F4EFE6",
          200: "#E6DFD1",
          300: "#CCC2B1",
          400: "#9C9281",
          500: "#756D5E",
          600: "#554E42",
          700: "#3B352D",
          800: "#27241F",
          900: "#181715",
        },
        brand: {
          DEFAULT: "#FDC841",
          amber: "#FDC841",
          gold: "#F5B82E",
          honey: "#D97706",
          dark: "#1E1E1E",
          cream: "#FAF7EE",
          sand: "#F4EFE6",
          // Harmonious palette mappings
          violet: "#1E1E1E",
          fuchsia: "#D97706",
          pink: "#F5B82E",
          orange: "#FDC841",
          lime: "#FDC841",
          cyan: "#3B352D",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #FDC841 0%, #F5B82E 100%)",
        "brand-gradient-dark": "linear-gradient(135deg, #1E1E1E 0%, #2A261F 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(253,200,65,0.22) 0%, rgba(245,184,46,0.12) 100%)",
      },
      boxShadow: {
        glow: "0 10px 30px -6px rgba(253, 200, 65, 0.45)",
        card: "0 2px 10px -2px rgba(24,23,21,0.03), 0 16px 36px -4px rgba(24,23,21,0.05)",
        "card-hover": "0 6px 20px -4px rgba(24,23,21,0.04), 0 28px 56px -6px rgba(253,200,65,0.2)",
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
