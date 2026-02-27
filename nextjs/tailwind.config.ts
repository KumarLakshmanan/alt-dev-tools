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
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        devtools: {
          bg:       "#1e1e1e",
          secondary:"#252526",
          tertiary: "#2d2d30",
          border:   "#3c3c3c",
          text:     "#cccccc",
          muted:    "#9d9d9d",
          blue:     "#75beff",
          green:    "#73c991",
          yellow:   "#cca700",
          red:      "#f48771",
        },
      },
      backgroundImage: {
        "hero-gradient":  "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)",
        "brand-gradient": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        "pro-gradient":   "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
