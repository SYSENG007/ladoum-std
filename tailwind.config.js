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
        // PRIMARY: Navy (#1F3C4F)
        primary: {
          DEFAULT: '#1F3C4F',
          50: '#f0f4f6',
          100: '#e0e8ec',
          200: '#c1d1d9',
          300: '#a2bac6',
          400: '#83a3b3',
          500: '#648ca0',
          600: '#1F3C4F', // Main navy
          700: '#19303f',
          800: '#13242f',
          900: '#0d1820',
          950: '#070c10',
        },

        // SECONDARY: Tan (#D6C2A9)
        secondary: {
          DEFAULT: '#D6C2A9',
          50: '#faf8f5',
          100: '#f5f0ea',
          200: '#ebe1d5',
          300: '#D6C2A9', // Main tan
          400: '#c9b094',
          500: '#bc9e7f',
          600: '#a8885d',
          700: '#866c4a',
          800: '#645137',
          900: '#423625',
        },

        // ACCENT: Gold (#E5A832)
        accent: {
          DEFAULT: '#E5A832',
          50: '#fef7e8',
          100: '#fdefc8',
          200: '#fbdf91',
          300: '#f9cf5a',
          400: '#E5A832', // Main gold
          500: '#d99520',
          600: '#b87a18',
          700: '#935f13',
          800: '#6e470e',
          900: '#4a2f09',
        },

        // NEUTRAL: Off-White & Dark Grey
        neutral: {
          white: '#F9F9F9',
          grey: '#5A5A5A',
          'placeholder': '#A0A0A0',
        },

        // Semantic Status Colors (unchanged)
        success: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          DEFAULT: '#ef4444',
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
          DEFAULT: '#eab308',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        info: {
          DEFAULT: '#3b82f6',
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

        // Reproduction-specific colors (unchanged)
        reproduction: {
          heat: {
            DEFAULT: '#ec4899',
            light: '#fce7f3',
            dark: '#be185d',
          },
          mating: {
            DEFAULT: '#a855f7',
            light: '#f3e8ff',
            dark: '#7e22ce',
          },
          birth: {
            DEFAULT: '#22c55e',
            light: '#dcfce7',
            dark: '#15803d',
          },
          gestation: {
            DEFAULT: '#f97316',
            light: '#ffedd5',
            dark: '#c2410c',
          },
          ultrasound: {
            DEFAULT: '#3b82f6',
            light: '#dbeafe',
            dark: '#1d4ed8',
          },
        },

        // Animal status colors (unchanged)
        status: {
          active: '#22c55e',
          sold: '#3b82f6',
          deceased: '#64748b',
          pending: '#eab308',
        },

        // Certification levels (unchanged)
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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
