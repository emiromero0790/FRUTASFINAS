/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        micolor: '#ff5b5b', // Negro con opacidad 54%
      },
    },
  },
  plugins: [],
};

