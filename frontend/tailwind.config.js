/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',
          slate: '#1E293B',
          blue: '#0284C7',
          emerald: '#059669',
        },
      },
    },
  },
  plugins: [],
};
