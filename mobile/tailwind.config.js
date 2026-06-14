/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // Trung tính: dùng CSS var để flip light/dark (xem global.css).
      // Brand: cố định (đẹp trên cả 2 nền).
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8", soft: "#eff4ff" },
        accent: "#0ea5e9",
        success: { DEFAULT: "#16a34a", soft: "#e8f7ee" },
        warning: { DEFAULT: "#d97706", soft: "#fdf3e3" },
        danger: { DEFAULT: "#dc2626", soft: "#fdeaea" },
        info: { DEFAULT: "#0284c7", soft: "#e6f4fb" },
      },
      borderRadius: { card: "16px" },
    },
  },
  plugins: [],
};
