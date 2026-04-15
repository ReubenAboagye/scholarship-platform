import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#4f46e5', // Primary Indigo
          700: '#4338ca', // Hover Indigo
          800: '#3730a3',
          900: '#312e81', // Deep Indigo
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'ambient': '0 4px 24px -1px rgba(0, 0, 0, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand-glow': '0 0 20px rgba(15, 127, 228, 0.15)',
      },
      animation: {
        'fade-up':  'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':  'fadeIn 0.4s ease-out both',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':  'shimmer 2s infinite linear',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
export default config;
