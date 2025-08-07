// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // No additional optimizeDeps entries required after switching icon libraries
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true, // bind to 0.0.0.0 (all interfaces)
    port: 5173, // или любой порт, который вам удобнее
    strictPort: true, // если порт занят — сразу выйдет с ошибкой
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
  },
});
