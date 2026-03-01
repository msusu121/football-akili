// ============================================================
// FILE: frontend/tailwind.config.ts
// DROP-IN REPLACEMENT — Mombasa United FC branding (Blue primary)
// ============================================================

import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mombasa United FC — Royal Blue, White & Red
        bg: "#f8f9fc",
        card: "#ffffff",
        muted: "#6b7280",
        line: "rgba(0,0,0,0.08)",
        ink: "#0a1628",
        dark: "#0a1628",
        brand: "#1a56db",        // Royal Blue primary
        "brand-2": "#3b82f6",    // Bright blue
        "brand-dark": "#1e40af", // Hover blue
        "brand-accent": "#d4a017", // Gold secondary
        "brand-red": "#dc2626",  // Red accent
        "ink-light": "#1a2a44",  // Gradient navy
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Bebas Neue", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10,22,40,0.12)",
        card: "0 4px 20px rgba(10,22,40,0.08)",
        hero: "0 12px 40px rgba(0,0,0,0.18)",
        glow: "0 0 40px rgba(26,86,219,0.15)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
} satisfies Config;
