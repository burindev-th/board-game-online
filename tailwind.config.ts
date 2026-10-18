import type { Config } from "tailwindcss";
import { playerColors } from "./src/lib/theme/playerColors";

const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-body)", "sans-serif"],
      body: ["var(--font-body)", "sans-serif"],
      heading: ["var(--font-heading)", "sans-serif"],
      number: ["var(--font-number)", "ui-monospace", "monospace"],
    },
    borderRadius: {
      none: "0",
      DEFAULT: "6px",
      sm: "6px",
      md: "12px",
      lg: "16px",
      full: "9999px",
      // legacy: ใช้แค่หน้า admin ลบออกเมื่อย้าย admin มาใช้ธีม
      xl: "16px",
      "2xl": "16px",
      "3xl": "16px",
    },
    extend: {
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), muted: token("surface-muted") },
        fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle") },
        ink: token("ink"),
        primary: { DEFAULT: token("primary"), on: token("on-primary") },
        secondary: { DEFAULT: token("secondary"), on: token("on-secondary") },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        "on-status": token("on-status"),
        backdrop: token("backdrop"),
        player: Object.fromEntries(playerColors.map((c, i) => [String(i + 1), c])),
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.1" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05" }],
        h1: ["1.75rem", { lineHeight: "1.2" }],
        "h1-lg": ["2.25rem", { lineHeight: "1.15" }],
        h2: ["1.375rem", { lineHeight: "1.25" }],
        "h2-lg": ["1.75rem", { lineHeight: "1.2" }],
        h3: ["1.125rem", { lineHeight: "1.35" }],
        "h3-lg": ["1.25rem", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
        number: ["4rem", { lineHeight: "1" }],
        "number-lg": ["6rem", { lineHeight: "1" }],
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0 0 rgb(var(--color-ink))",
        brutal: "4px 4px 0 0 rgb(var(--color-ink))",
        "brutal-lg": "6px 6px 0 0 rgb(var(--color-ink))",
      },
      transitionDuration: { fast: "120ms", modal: "200ms" },
      zIndex: { modal: "50", toast: "60" },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "backdrop-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "backdrop-in": "backdrop-in 200ms ease-out both",
        "modal-in": "modal-in 200ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
