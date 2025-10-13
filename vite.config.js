// vite.config.js
import { env } from "node:process";
import process from "node:process";
import path from "path";
import { fileURLToPath } from "url";

import viteImagemin from "@vheemstra/vite-plugin-imagemin";
import react from "@vitejs/plugin-react";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const enableBrotli = process.env.ENABLE_BROTLI === "true";
  const base = env.BASE_PATH ?? "/";
  const rollupPlugins = [];

  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    // Allow Vite React Refresh preamble and eval only in dev
    `script-src 'self'${isProd ? "" : " 'unsafe-inline' 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    // Allow Vite HMR WS in dev and Supabase in both
    `connect-src 'self' ${isProd ? "" : "ws: wss:"} https://*.supabase.co https://*.supabase.in`,
    // Allow self/data and generic https fonts (dev-friendly)
    "font-src 'self' data: https:",
  ].join("; ");

  const securityHeaders = {
    "Content-Security-Policy": csp,
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };

  if (env.ANALYZE === "true") {
    const { visualizer } = await import("rollup-plugin-visualizer");
    rollupPlugins.push(visualizer({ filename: "stats.html" }));
  }

  return {
    base,
    plugins: [
      react(),
      ...(isProd
        ? [
            viteImagemin({
              cache: true,
              plugins: {
                jpg: imageminMozjpeg({ quality: 80 }),
                png: imageminPngquant({ quality: [0.65, 0.8] }),
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
    esbuild: isProd ? { drop: ["console", "debugger"] } : {},
    build: {
      sourcemap: mode === "staging",
      rollupOptions: {
        plugins: rollupPlugins,
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
          // Force .js extensions for all JavaScript files
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            if (/\.(js|mjs|jsx)$/i.test(assetInfo.name)) {
              return "assets/[name]-[hash].js";
            }
            return "assets/[name]-[hash].[ext]";
          },
          // Ensure proper module format
          format: "es",
        },
      },
      // Ensure proper module format
      target: "esnext",
      minify: "esbuild",
    },
    server: {
      host: true, // 0.0.0.0
      port: 5173,
      strictPort: true,
      headers: securityHeaders,
    },
    preview: {
      headers: securityHeaders,
    },
  };
});
