import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg0: "#070a12",
        bg1: "#0b1220",
      },
      boxShadow: {
        glow: "0 0 0 4px rgba(105,168,255,.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;

