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
        // Brand is now a deep institutional navy rather than indigo/violet.
        // Keeps the existing "brand-50…brand-900" API intact so we don't have
        // to rewrite every component at once.
        brand: {
          50:  '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#334155',
          600: '#1e3a8a', // Primary Navy
          700: '#1e3578', // Hover Navy
          800: '#1a2e66',
          900: '#172554', // Deep Navy
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
