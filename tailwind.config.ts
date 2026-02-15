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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Priority colors
        priority: {
          p1: "#EF4444", // Red - Urgent
          p2: "#F59E0B", // Orange - Important
          p3: "#3B82F6", // Blue - Normal
          fysa: "#6B7280", // Gray - Info only
        },
        // Status colors
        status: {
          overdue: "#DC2626",
          today: "#F59E0B",
          upcoming: "#10B981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
