import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light canvas + Murang'a-style orange accent
        bg: "#fbf9f4",
        card: "#ffffff",
        muted: "#5b6775",
        line: "rgba(0,0,0,0.10)",
        ink: "#0b1020",
        dark: "#0b1020",
        brand: "#d46b1f" // dark orange accent
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)"
      }
    },
  },
  plugins: [],
} satisfies Config;
