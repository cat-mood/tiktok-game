/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        ink: '#07070c',
        panel: '#12121a',
        line: '#2a2a3a',
        cyan: '#00f0ff',
        mag: '#ff2d6a',
        gold: '#ffd166',
      },
      boxShadow: {
        glow: '0 0 40px rgba(0, 240, 255, 0.18)',
        mag: '0 0 32px rgba(255, 45, 106, 0.2)',
      },
    },
  },
  plugins: [],
}
