/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'mobile-nav-backdrop': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'mobile-nav-drawer': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'mobile-nav-backdrop': 'mobile-nav-backdrop 0.22s ease-out forwards',
        'mobile-nav-drawer': 'mobile-nav-drawer 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
    },
  },
  plugins: [],
}

