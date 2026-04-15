/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eef7ff', 100: '#d9edff', 200: '#bce0ff', 300: '#8eccff', 400: '#58b0ff', 500: '#3291ff', 600: '#1a73f5', 700: '#155de1', 800: '#174bb6', 900: '#19418f' },
        success: { 500: '#22c55e', 600: '#16a34a' },
        danger: { 500: '#ef4444', 600: '#dc2626' },
        warning: { 500: '#f59e0b', 600: '#d97706' },
      }
    }
  },
  plugins: [],
};
