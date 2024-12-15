/** @type {import('tailwindcss').Config} */
export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#1F1F1F',       // Custom dark color
        aqua: '#44FFD1',       // Custom aqua color
        purple: '#5F4BB6',     // Custom purple color
      },
    },
  },
  plugins: [],
}

