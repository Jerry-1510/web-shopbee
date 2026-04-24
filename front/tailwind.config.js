/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shopbee: {
          blue: "#007aff",
          lightBlue: "#58a6ff",
        },
      },
    },
  },
  plugins: [],
};

