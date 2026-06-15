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
          50: "#F0FDFA",
          100: "#CCFBF1",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          900: "#134E4A"
        },
        sand: "#F8FAFC"
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
