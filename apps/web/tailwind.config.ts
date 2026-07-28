import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d0d',
          light: '#1a1a1a',
          card: '#141414',
        },
        accent: {
          DEFAULT: '#c8ff00',
          dim: '#a3cc00',
        },
      },
    },
  },
  plugins: [],
};

export default config;
