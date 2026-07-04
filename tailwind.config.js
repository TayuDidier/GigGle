/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: {
          DEFAULT: '#00236f',
          container: '#1e3a8a',
          on: '#ffffff',
          'on-container': '#90a8ff',
          'fixed-dim': '#b6c4ff',
          inverse: '#b6c4ff',
        },
        secondary: {
          DEFAULT: '#006c4e',
          container: '#97f5cc',
          on: '#ffffff',
          'on-container': '#007353',
        },
        orange: {
          DEFAULT: '#ef9900',
          light: '#ffb95f',
          dark: '#c47d00',
        },
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          low: '#eff4ff',
          container: '#e5eeff',
          high: '#dce9ff',
          highest: '#d3e4fe',
          white: '#ffffff',
        },
        'on-surface': '#0b1c30',
        'on-surface-variant': '#444651',
        outline: { DEFAULT: '#757682', variant: '#c5c5d3' },
        error: { DEFAULT: '#ba1a1a', container: '#ffdad6' },
      },
      borderRadius: {
        sm: '0.25rem', DEFAULT: '0.5rem', md: '0.75rem',
        lg: '1rem', xl: '1.5rem', '2xl': '2rem', full: '9999px',
      },
      boxShadow: {
        card:        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover':'0 8px 24px -4px rgba(0,35,111,0.14), 0 2px 8px -2px rgba(0,35,111,0.08)',
        elevated:    '0 4px 20px -2px rgba(0,35,111,0.12), 0 2px 6px -2px rgba(0,0,0,0.06)',
        glow:        '0 0 0 3px rgba(0,35,111,0.15)',
        'glow-orange':'0 0 0 3px rgba(239,153,0,0.2)',
        glass:       '0 8px 32px rgba(0,35,111,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        250: '250ms',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':  'fade-up 0.4s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in':  'fade-in 0.3s ease both',
        shimmer:    'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
