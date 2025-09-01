// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import viteCompression from "vite-plugin-compression";
import viteImagemin from "@vheemstra/vite-plugin-imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const enableBrotli = process.env.ENABLE_BROTLI === "true";
  return {
    plugins: [
      react(),
      ...(isProd
        ? [
            viteImagemin({
              plugins: {
                jpg: imageminMozjpeg(),
                png: imageminPngquant(),
              },
            }),
            viteCompression({ threshold: 8192 }),
            ...(enableBrotli
              ? [
                  viteCompression({
                    algorithm: "brotliCompress",
                    threshold: 8192,
                  }),
                ]
              : []),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react-vendor";
              if (id.includes("react-router-dom")) return "react-router";
              if (id.includes("@supabase")) return "supabase";
            }
            if (id.includes("src/pages")) {
              return path.basename(id, ".jsx").toLowerCase();
            }
          },
        },
      },
    },
    server: {
      host: true, // 0.0.0.0
      port: 5173,
      strictPort: true,
    },
  };
});
