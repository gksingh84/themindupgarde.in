import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Editorial brand colours as per Master Project Prompt
        navy: {
          950: '#0A121E',
          900: '#0E1724',
          800: '#14243A', // Primary Brand Deep Navy
          700: '#1B2F4B',
          600: '#253E61',
        },
        slateBrand: {
          DEFAULT: '#405B78', // Secondary Slate Blue
          50: '#F5F7FA',
          100: '#E8ECF2',
          200: '#D2DAE5',
          300: '#B0BDCF',
          400: '#738BA7',
          500: '#405B78',
          600: '#32475E',
          700: '#263647',
          800: '#1B2632',
        },
        amberBrand: {
          DEFAULT: '#E5A64B', // Accent Warm Amber
          50: '#FDF9F2',
          100: '#FAF1DE',
          200: '#F4DEB5',
          300: '#EDC885',
          400: '#E5A64B',
          500: '#D99128',
          600: '#B87216',
          700: '#8C5210',
        },
        charcoal: {
          DEFAULT: '#252B32', // Body Text Charcoal
          50: '#F7F8F9',
          100: '#ECEEF1',
          200: '#D6D9DE',
          500: '#737B85', // Muted Text Grey
          700: '#3D444D',
          800: '#2D343C',
          900: '#252B32',
        },
        offwhite: '#FAFAF7', // Warm background
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"DM Serif Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Inter"', '"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', '"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        editorial: '0 10px 30px -10px rgba(20, 36, 58, 0.08)',
        'editorial-hover': '0 20px 40px -15px rgba(20, 36, 58, 0.16)',
        'amber-glow': '0 0 35px -5px rgba(229, 166, 75, 0.35)',
        'navy-card': '0 4px 20px -2px rgba(10, 18, 30, 0.3)',
      },
      maxWidth: {
        'reading': '760px',
        'sidebar': '320px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
