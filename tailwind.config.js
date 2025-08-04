/* eslint-env node */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: { extend: {} },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['light','dark','cupcake','retro','cyberpunk'],
  },
}
