import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    exclude: ["node_modules/**", "supabase/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/utils/logger.js", "src/utils/date.js"],
    },
  },
});
