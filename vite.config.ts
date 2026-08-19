import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://rrai-backend-production.apexcloudr3.workers.dev",
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.svg"],
      manifest: {
        name: "Jol — карта риска Астаны",
        short_name: "Jol",
        description:
          "Полноэкранная карта риска Астаны с подтверждёнными событиями, AI-прогнозами и статистикой в реальном времени.",
        theme_color: "#1d4ed8",
        background_color: "#ffffff",
        display: "standalone",
        icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    process.env.ANALYZE === "true"
      ? visualizer({ open: true, gzipSize: true, brotliSize: true })
      : null,
  ].filter(Boolean),
});
