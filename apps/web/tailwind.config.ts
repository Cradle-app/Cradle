import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme - deep space aesthetic
        forge: {
          bg: '#050508',
          surface: '#0c0c12',
          elevated: '#141420',
          border: '#1e1e2e',
          muted: '#5a5a7a',
          text: '#e4e4ef',
        },
        accent: {
          cyan: '#00d4ff',
          magenta: '#c026d3',
          lime: '#22c55e',
          amber: '#f59e0b',
          coral: '#f43f5e',
          purple: '#8b5cf6',
        },
        node: {
          contracts: '#00d4ff',
          payments: '#f59e0b',
          agents: '#c026d3',
          app: '#22c55e',
          quality: '#f43f5e',
          intelligence: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        'grid-dots': `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15), transparent 60%)',
        'glow-magenta': 'radial-gradient(ellipse at center, rgba(192, 38, 211, 0.15), transparent 60%)',
        'glow-multi': `
          radial-gradient(ellipse at 20% 30%, rgba(0, 212, 255, 0.08), transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(192, 38, 211, 0.08), transparent 50%)
        `,
        'mesh-gradient': `
          radial-gradient(at 40% 20%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(192, 38, 211, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(34, 197, 94, 0.06) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(245, 158, 11, 0.06) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(139, 92, 246, 0.08) 0px, transparent 50%)
        `,
      },
      backgroundSize: {
        'grid': '32px 32px',
        'grid-lg': '64px 64px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px var(--tw-shadow-color)',
        'glow': '0 0 25px -5px var(--tw-shadow-color)',
        'glow-lg': '0 0 40px -10px var(--tw-shadow-color)',
        'inner-glow': 'inset 0 0 20px -5px var(--tw-shadow-color)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

