import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2C3E7D', // Navy Blue
          50: '#E8EAF3',
          100: '#D1D6E7',
          200: '#A3ADCF',
          300: '#7584B7',
          400: '#475B9F',
          500: '#2C3E7D',
          600: '#233264',
          700: '#1A254B',
          800: '#111932',
          900: '#090C19',
        },
        accent: {
          DEFAULT: '#FDB913', // Yellow/Gold
          50: '#FFF9E5',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#FDB913',
          600: '#CA940F',
          700: '#976F0B',
          800: '#644A08',
          900: '#322504',
        },
        border: 'rgba(44, 62, 125, 0.2)',
        input: 'rgba(44, 62, 125, 0.2)',
        ring: '#2C3E7D',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
