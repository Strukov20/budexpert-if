/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#D00000',
        dark: '#111827',
        light: '#ffffff'
      }
    }
  },
  plugins: [],
}
