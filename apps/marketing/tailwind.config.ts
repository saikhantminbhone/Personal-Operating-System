import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080C12', surface: '#0D1520', border: 'rgba(100,255,218,0.1)',
        accent: '#64FFDA', 'accent-blue': '#00B4D8', text: '#E2E8F0', muted: '#64748B',
      },
      fontFamily: { mono: ['IBM Plex Mono', 'monospace'], sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
