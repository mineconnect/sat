/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        'surface-primary': '#161B22',
        'surface-secondary': '#21262D',
        'on-surface-primary': '#C9D1D9',
        'on-surface-secondary': '#8B949E',
        primary: '#2F81F7',
        'primary-hover': '#1F6FEB',
        'border-primary': '#30363D',
        'border-secondary': '#21262D',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
