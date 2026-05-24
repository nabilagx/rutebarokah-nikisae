/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        emeraldMain: "#0D5B47",
        tealSecondary: "#2FA58A",
        ivory: "#F7F4EE",
        sand: "#EAD7B5",
        mutedGold: "#CFA64A",
        charcoal: "#1F1F1F",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 24px 70px rgba(13, 91, 71, 0.16)",
        soft: "0 14px 35px rgba(31, 31, 31, 0.09)",
      },
      backgroundImage: {
        "islamic-grid":
          "linear-gradient(135deg, rgba(207,166,74,.12) 12%, transparent 12%, transparent 50%, rgba(207,166,74,.12) 50%, rgba(207,166,74,.12) 62%, transparent 62%, transparent)",
      },
    },
  },
  plugins: [],
};
