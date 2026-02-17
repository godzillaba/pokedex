import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.js"],
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "American Wildlife Pokédex",
        short_name: "WildDex",
        description: "A retro Pokédex for American wildlife",
        theme_color: "#cc0000",
        background_color: "#cc0000",
        display: "standalone",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png,jpg,svg,webp}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
