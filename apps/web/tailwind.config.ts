import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  './lib/**/*.{js,ts,jsx,tsx,mdx}',
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'os-bg':       '#080C12',
        'os-surface':  '#0D1520',
        'os-elevated': '#141E2D',
        'os-border':   'rgba(100,255,218,0.1)',
        'os-accent':   '#64FFDA',
        'os-text':     '#E2E8F0',
        'os-muted':    '#64748B',
        'os-danger':   '#EF4444',
        'os-success':  '#22C55E',
        'os-warning':  '#F59E0B',
        'os-info':     '#00B4D8',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'os':      '0 4px 24px rgba(0,0,0,0.4)',
        'os-glow': '0 0 20px rgba(100,255,218,0.15)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}

export default config
