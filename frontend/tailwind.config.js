/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ✅ IMPORTANT pour mode sombre manuel
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
