/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        forest: {
          50: '#EFF6F3',
          100: '#D6E8DF',
          200: '#A7CDC0',
          300: '#74B09D',
          400: '#46907A',
          500: '#1B5E4B',
          600: '#16503F',
          700: '#114033',
          800: '#0D3229',
          900: '#0A2620',
        },
        cream: {
          50: '#FBFAF6',
          100: '#F5F1E8',
          200: '#EBE2CF',
          300: '#DED0B1',
          400: '#CFBD8F',
          500: '#C1A96D',
        },
        amberGold: {
          50: '#FBF7EB',
          100: '#F5EAC8',
          200: '#EDD892',
          300: '#E4C45C',
          400: '#D4A853',
          500: '#C8912E',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', '"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(27, 94, 75, 0.08), 0 2px 8px -2px rgba(27, 94, 75, 0.06)',
        card: '0 8px 30px -4px rgba(27, 94, 75, 0.10), 0 4px 12px -4px rgba(27, 94, 75, 0.06)',
        hover: '0 12px 40px -6px rgba(27, 94, 75, 0.18), 0 6px 18px -4px rgba(27, 94, 75, 0.10)',
      },
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.95' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '0.4' },
          '100%': { transform: 'scale(0.95)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
