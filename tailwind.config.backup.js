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

        // Semantic Status Colors
        success: {
          DEFAULT: '#10b981', // emerald-500
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
        },
        danger: {
          DEFAULT: '#ef4444', // red-500
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        info: {
          DEFAULT: '#3b82f6', // blue-500
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Reproduction-specific colors
        reproduction: {
          heat: {
            DEFAULT: '#ec4899', // pink-500
            light: '#fce7f3',   // pink-100
            dark: '#be185d',    // pink-700
          },
          mating: {
            DEFAULT: '#a855f7', // purple-500
            light: '#f3e8ff',   // purple-100
            dark: '#7e22ce',    // purple-700
          },
          birth: {
            DEFAULT: '#10b981', // emerald-500
            light: '#d1fae5',   // emerald-100
            dark: '#047857',    // emerald-700
          },
          gestation: {
            DEFAULT: '#f97316', // orange-500
            light: '#ffedd5',   // orange-100
            dark: '#c2410c',    // orange-700
          },
          ultrasound: {
            DEFAULT: '#3b82f6', // blue-500
            light: '#dbeafe',   // blue-100
            dark: '#1d4ed8',    // blue-700
          },
        },

        // Animal status colors
        status: {
          active: '#10b981',    // emerald-500
          sold: '#3b82f6',      // blue-500
          deceased: '#64748b',  // slate-500
          pending: '#f59e0b',   // amber-500
        },

        // Certification levels
        certification: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#e5e4e2',
          elite: '#b9f2ff',
        },

        // Theme-aware semantic colors using CSS variables
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
