/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
      },
      screens: {
        xs: '320px',
        sm2: '480px',
      },
    },
  },
  plugins: [],
}
