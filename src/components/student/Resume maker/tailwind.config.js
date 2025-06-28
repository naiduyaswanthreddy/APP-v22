/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        '1/8': '12.5%',
        '7/8': '87.5%',
      }
    }
  },
  plugins: [],
}