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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          ink: "#0a0a0b",
          body: "#3f3f46",
          muted: "#71717a",
          purple: "#8b5cf6",
          "purple-dark": "#6d28d9",
          "purple-soft": "#ede9fe",
          ocean: "#22d3ee",
          "ocean-soft": "#ecfeff",
          mint: "#34d399",
          "mint-soft": "#d1fae5",
          cream: "#faf9f7",
          surface: "#f4f3f0",
          obsidian: "#0a0a0b",
          charcoal: "#18181b",
          graphite: "#27272a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
        lift: "0 24px 64px rgba(0,0,0,0.12)",
        glow: "0 0 80px rgba(139,92,246,0.25)",
        "glow-cyan": "0 0 60px rgba(34,211,238,0.2)",
        glass: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "mesh-dark":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.18), transparent), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(34,211,238,0.12), transparent), radial-gradient(ellipse 40% 30% at 10% 60%, rgba(52,211,153,0.08), transparent)",
        "mesh-light":
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.06), transparent), radial-gradient(ellipse 50% 40% at 100% 50%, rgba(34,211,238,0.05), transparent)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        shimmer: "shimmer 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
