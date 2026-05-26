import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          ink: "#163300",
          body: "#37514a",
          muted: "#5c6c66",
          purple: "#4f46e5",
          "purple-dark": "#3730a3",
          "purple-soft": "#eef2ff",
          ocean: "#0891b2",
          "ocean-soft": "#e0f2fe",
          mint: "#10b981",
          "mint-soft": "#d1fae5",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,23,42,0.06)",
        lift: "0 16px 48px rgba(79,70,229,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
