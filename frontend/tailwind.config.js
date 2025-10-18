import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6ff',
          100: '#e2e9ff',
          200: '#c6d4ff',
          300: '#99b4ff',
          400: '#6a8dff',
          500: '#3f5fff',
          600: '#1f37f5',
          700: '#1527d1',
          800: '#1421a7',
          900: '#131e86',
        },
        slate: {
          950: '#0b1324',
        },
      },
      boxShadow: {
        card: '0 10px 35px -15px rgba(15, 23, 42, 0.35)',
        input: '0 0 0 2px rgba(63, 95, 255, 0.25)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
};
