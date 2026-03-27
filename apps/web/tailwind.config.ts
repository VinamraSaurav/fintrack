import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        fintrack: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#10b981',
          neutral: '#374151',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          'base-content': '#1f2937',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
  },
};

export default config;
