import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102033",
        sand: "#f7f5ef",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft:
          "0 1px 2px 0 rgb(16 32 51 / 0.04), 0 12px 32px -16px rgb(16 32 51 / 0.18)",
        lift: "0 24px 48px -16px rgb(16 32 51 / 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
