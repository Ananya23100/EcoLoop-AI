/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        grade: {
          A: '#16a34a',
          B: '#2563eb',
          C: '#ea580c',
          D: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
