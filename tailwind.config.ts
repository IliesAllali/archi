import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0A0A0B",
          surface: "#111113",
          elevated: "#18181B",
          hover: "#1F1F23",
          active: "#27272A",
        },
        line: {
          DEFAULT: "#1F1F23",
          strong: "#2E2E35",
          subtle: "#161619",
        },
        label: {
          primary: "#EDEDEF",
          secondary: "#8B8B93",
          muted: "#56565E",
          faint: "#3B3B42",
        },
        accent: {
          DEFAULT: "var(--accent, #5E6AD2)",
          muted: "var(--accent-muted, rgba(94, 106, 210, 0.12))",
          strong: "var(--accent-strong, rgba(94, 106, 210, 0.24))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
        lg: ["0.9375rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.625rem" }],
        "2xl": ["1.375rem", { lineHeight: "1.75rem" }],
      },
      borderRadius: {
        node: "8px",
        panel: "12px",
      },
      animation: {
        "slide-in": "slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out": "slide-out 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 150ms ease-out",
        "scale-in": "scale-in 150ms ease-out",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
