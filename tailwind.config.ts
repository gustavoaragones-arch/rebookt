import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(28, 58, 47, 0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(28, 58, 47, 0)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: {
          base: "var(--color-bg-base)",
          surface: "var(--color-bg-surface)",
          subtle: "var(--color-bg-subtle)",
        },
        ink: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        brand: {
          DEFAULT: "var(--color-brand)",
          light: "var(--color-brand-light)",
          accent: "var(--color-brand-accent)",
        },
        line: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
