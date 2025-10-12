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
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const isTest = mode === "test";
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
      ...(isTest
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: [
                "icons/icon-192.svg",
                "icons/icon-512.svg",
                "env.js",
              ],
              manifest: {
                name: "Inventory Control",
                short_name: "Inventory",
                description: "Управление объектами и задачами инвентаризации",
                start_url: "/",
                display: "standalone",
                background_color: "#0f172a",
                theme_color: "#1d4ed8",
                icons: [
                  {
                    src: "/icons/icon-192.svg",
                    sizes: "192x192",
                    type: "image/svg+xml",
                    purpose: "any",
                  },
                  {
                    src: "/icons/icon-512.svg",
                    sizes: "512x512",
                    type: "image/svg+xml",
                    purpose: "any maskable",
                  },
                ],
              },
              workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
                runtimeCaching: [
                  {
                    urlPattern: ({ sameOrigin, url }) =>
                      Boolean(sameOrigin && url.pathname.startsWith("/")),
                    handler: "NetworkFirst",
                    options: {
                      cacheName: "app-pages",
                      networkTimeoutSeconds: 6,
                      expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 60 * 60 * 24,
                      },
                    },
                  },
                  {
                    urlPattern: /https:\/\/.*supabase\.(co|in)\//,
                    handler: "NetworkFirst",
                    options: {
                      cacheName: "supabase-api",
                      networkTimeoutSeconds: 10,
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 10,
                      },
                    },
                  },
                ],
              },
              devOptions: {
                enabled: true,
              },
            }),
          ]),
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
        },
      },
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
