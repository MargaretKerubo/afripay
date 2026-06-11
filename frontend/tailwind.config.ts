import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── AfriPay Design Tokens ──────────────────────────────────────────────
      colors: {
        // Primary: deep Africa-night navy
        navy: {
          950: "#050A18",
          900: "#0A1128",
          800: "#0F1A3E",
          700: "#162450",
        },
        // Accent: Bitcoin gold
        gold: {
          400: "#F7B731",
          500: "#F59E0B",
          600: "#D97706",
        },
        // Highlight: electric savanna green
        savanna: {
          400: "#34D399",
          500: "#10B981",
        },
        // Neutral text
        sand: {
          100: "#F5F0E8",
          200: "#EDE6D6",
          400: "#BFB49A",
          600: "#7A6F5C",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],   // bold geometric display
        body: ["'Inter'", "sans-serif"],      // clean body
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "africa-radial": "radial-gradient(ellipse 80% 60% at 50% 0%, #162450 0%, #050A18 70%)",
        "gold-glow": "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(247,183,49,0.15), transparent)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "count-up": "countUp 1s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(247,183,49,0.4)" },
          "50%": { boxShadow: "0 0 0 16px rgba(247,183,49,0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
