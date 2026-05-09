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
        // Body / UI
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Display / editorial headlines — gives the site its non-template feel
        serif: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        // Brand colors - Unipix-inspired crimson/maroon theme
        // Primary crimson/maroon for hero sections and CTAs
        brand: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#890C25', // Primary Crimson (Unipix)
          700: '#B71A34', // Hover Crimson (Unipix)
          800: '#991B1B',
          900: '#7F1D1D', // Deep Crimson
        },
        // Neutral paper — flat off-white for sections that used to be bg-slate-50
        paper: {
          DEFAULT: '#FAFAF7',
          50:  '#FDFDFB',
          100: '#FAFAF7',
          200: '#F4F3EE',
        },
        // Subtle accent for highlights (used very sparingly, not as primary)
        accent: {
          500: '#B45309', // warm amber — for "Full Funding" pills etc.
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        // Much more restrained than before — publication-card feel, not floating SaaS card.
        'card':     '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.02)',
        'card-hover':'0 2px 6px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'ambient':  '0 4px 24px -1px rgba(0, 0, 0, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand-glow': '0 0 20px rgba(30, 58, 138, 0.12)',
      },
      animation: {
        'fade-up':  'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':  'fadeIn 0.4s ease-out both',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':  'shimmer 2s infinite linear',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float':    'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spotlight': 'spotlight 8s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        pulseGlow: { '0%, 100%': { opacity: '0.5', transform: 'scale(1)' }, '50%': { opacity: '0.8', transform: 'scale(1.05)' } },
        spotlight: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
};
export default config;
