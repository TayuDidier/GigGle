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
        lg: '1rem', xl: '1.5rem', full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px 0 rgba(0,35,111,0.12)',
      },
    },
  },
  plugins: [],
}
