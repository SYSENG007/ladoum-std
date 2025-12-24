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
        primary: {
          DEFAULT: '#059669', // emerald-600
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Semantic theme colors using CSS variables
        'bg-primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        'bg-muted': 'rgb(var(--color-bg-muted) / <alpha-value>)',

        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',

        'border-default': 'rgb(var(--color-border-default) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        'border-bold': 'rgb(var(--color-border-bold) / <alpha-value>)',

        'surface-card': 'rgb(var(--color-surface-card) / <alpha-value>)',
        'surface-modal': 'rgb(var(--color-surface-modal) / <alpha-value>)',
        'surface-input': 'rgb(var(--color-surface-input) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',

        'overlay-hover': 'rgb(var(--color-overlay-hover) / <alpha-value>)',
        'overlay-focus': 'rgb(var(--color-overlay-focus) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
