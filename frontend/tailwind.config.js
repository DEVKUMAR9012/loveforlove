/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fef5f0',
          100: '#fce9e1',
          200: '#f8d7c8',
          300: '#f4bfad',
          400: '#ef9f88',
          500: '#e97963',
          600: '#d45a47',
          700: '#b73e35',
          800: '#98302b',
          900: '#7d2620',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
