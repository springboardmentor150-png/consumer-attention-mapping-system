/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "#151B2C",
        darkBorder: "#222D44",
        accentCyan: "#00F2FE",
        accentBlue: "#4FACFE",
        accentGreen: "#39FF14",
        accentOrange: "#FF5E36",
        neonPurple: "#BD00FF",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        neon: "0 0 15px rgba(79, 172, 254, 0.4)",
      },
    },
  },
  plugins: [],
}
