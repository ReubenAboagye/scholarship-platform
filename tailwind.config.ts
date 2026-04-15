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
          50:  '#f0f7ff',
          100: '#e0efff',
          200: '#baddff',
          300: '#7ec2ff',
          400: '#389ef8',
          500: '#0f7fe4',
          600: '#0362c2',
          700: '#044d9d',
          800: '#084180',
          900: '#0d366b',
        },
      },
      boxShadow: {
        card:  '0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)',
        brand: '0 4px 24px rgba(15,127,228,0.22)',
      },
      animation: {
        'fade-up':  'fadeUp 0.45s ease both',
        'fade-in':  'fadeIn 0.35s ease both',
        'slide-in': 'slideIn 0.4s ease both',
        'shimmer':  'shimmer 1.4s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
export default config;
