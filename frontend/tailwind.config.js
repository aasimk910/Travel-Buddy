/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-green': '#10b981',
        'accent-green-hover': '#059669',
        'glass-text': 'rgba(255, 255, 255, 0.95)',
        'glass-light': 'rgba(255, 255, 255, 0.8)',
        'glass-dim': 'rgba(255, 255, 255, 0.6)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'glass-card': 'rgba(255, 255, 255, 0.15)',
        'glass-medium': 'rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
