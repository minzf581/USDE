/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D43F9',
          light: '#4AD8FD',
        },
        secondary: {
          black: '#000000',
          dark: '#292929',
          light: '#F2F5F9',
          lighter: '#E2E7ED',
          lightest: '#D0D8E2',
        },
        accent: {
          orange: '#F98524',
          gold: '#FDB62C',
        }
      },
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'noise': "url('/public/_textures/texture 1 - noise/Eon - texture 1 - blue.png')",
        'glitch': "url('/public/_textures/texture 2 - glitch/Eon - texture 2 - blue.png')",
      }
    },
  },
  plugins: [],
} 