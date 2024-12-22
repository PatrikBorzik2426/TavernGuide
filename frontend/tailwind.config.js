/** @type {import('tailwindcss').Config} */
export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#1F1F1F',       // Custom dark color
        aqua: '#44FFD1',       // Custom aqua color
        purple: '#5F4BB6',     // Custom purple color
        light_purple: '#7B6DAA', // Custom light purple color
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'], // Add Manrope as the primary sans font
      },
      backgroundImage:({
        'gradient-radial-to-tr': 'radial-gradient(115% 90% at 0% 100%, var(--tw-gradient-stops))',
        'gradient-radial-to-tl': 'radial-gradient(115% 90% at 100% 100%, var(--tw-gradient-stops))',
        'gradient-radial-to-br': 'radial-gradient(90% 115% at 0% 0%, var(--tw-gradient-stops))',
        'gradient-radial-to-bl': 'radial-gradient(90% 115% at 100% 0%, var(--tw-gradient-stops))',
      })
    },
  },
  plugins: [
    require('tailwindcss-animated'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar'),

  ]
}

