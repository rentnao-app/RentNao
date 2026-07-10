/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0faf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#2f8444',
          700: '#256c38',
          800: '#1f5730',
          900: '#1a4728',
          label: '#2A7D4F',
          labelBg: '#E8F4EE',
          ink: '#1a4728',
          muted: '#4a6358',
        },
      },
      boxShadow: {
        hero: '0 24px 64px -12px rgba(15, 23, 42, 0.1)',
        card: '0 12px 40px -8px rgba(26, 71, 40, 0.14)',
        'search-panel': '0 32px 64px -16px rgba(15, 23, 42, 0.12)',
      },
      maxWidth: {
        home: '75rem',
      },
      keyframes: {
        'hero-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'mobile-nav-backdrop': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'mobile-nav-drawer': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'mobile-nav-backdrop-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'mobile-nav-drawer-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'hero-float': 'hero-float 5s ease-in-out infinite',
        'mobile-nav-backdrop': 'mobile-nav-backdrop 0.3s ease-out forwards',
        'mobile-nav-drawer': 'mobile-nav-drawer 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'mobile-nav-backdrop-out': 'mobile-nav-backdrop-out 0.28s ease-in forwards',
        'mobile-nav-drawer-out': 'mobile-nav-drawer-out 0.36s cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
    },
  },
  plugins: [],
}

