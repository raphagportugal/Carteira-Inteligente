import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        moss: {
          50: "#DCFCE7",
          100: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          900: "#14532D"
        },
        sand: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        danger: "#DC2626",
        warning: "#F59E0B",
        muted: "#64748B"
      },
      boxShadow: {
        soft: "0 24px 70px -35px rgba(15, 23, 42, 0.22)"
      },
      backgroundImage: {
        "soft-grid":
          "linear-gradient(to right, rgba(148,163,184,.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.10) 1px, transparent 1px)"
      }
    },
  },
  plugins: [],
};

export default config;
