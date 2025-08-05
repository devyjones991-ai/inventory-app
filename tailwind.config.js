/* eslint-env node */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        secondary: '#64748b',
        accent: '#f97316',
      },
      fontSize: {
        heading: '1.5rem',
        body: '1rem',
        caption: '0.875rem',
      }
    }
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['light','dark','cupcake','retro','cyberpunk'],
  },
}
