// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // bind to 0.0.0.0 (all interfaces)
    port: 5173,       // или любой порт, который вам удобнее
    strictPort: true, // если порт занят — сразу выйдет с ошибкой
  },
})
