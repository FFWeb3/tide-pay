/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepblue: {
          50: '#f0f5fa',
          100: '#dce7f3',
          200: '#b8cfe7',
          300: '#8eb3d7',
          400: '#5c90c3',
          500: '#3873af',
          600: '#285a92',
          700: '#204775',
          800: '#1a3a60',
          900: '#0e2440',
          950: '#09172c',
        },
        surface: {
          base: '#ffffff',
          soft: '#f8fafc',
          muted: '#f1f5f9',
          subtle: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['"Neue Montreal"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
