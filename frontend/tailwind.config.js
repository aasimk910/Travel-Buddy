/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Cinematic Dark Palette ─────────────────────────────────────────
        'bg-base':        '#0B0F0C',
        'surface':        '#111714',
        'surface-card':   '#161D19',
        'text-primary':   '#F5F3EE',
        'text-secondary': '#B8B4AA',
        'text-muted':     '#8E8A81',
        'accent-gold':      '#C6A16E',
        'accent-gold-hover':'#D4AE7A',
        'accent-moss':    '#8FA68E',
        // backward-compat aliases
        'accent-green':      '#8FA68E',
        'accent-green-hover':'#9DB89C',
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn:  'fadeIn 0.25s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
