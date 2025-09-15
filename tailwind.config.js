const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],

  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
    hoverOnlyWhenSupported: true,
    disableColorOpacityUtilitiesByDefault: true,
    respectDefaultRingColorOpacity: true,
  },

  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
    },
  },

  // Optimize CSS generation
  experimental: {
    optimizeUniversalDefaults: true,
    matchVariant: true,
  },

  // Optimize CSS output
  variants: {
    extend: {
      opacity: ['group-hover'],
      transform: ['group-hover'],
      scale: ['group-hover'],
      backgroundColor: ['active', 'group-focus'],
      textColor: ['group-focus'],
      borderColor: ['group-focus'],
    },
  },

  plugins: [],
}