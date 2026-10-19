import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    host: true, // reachable from phones on the same Wi-Fi (for QR scanning demos)
    // The Express API runs separately; Vite forwards /api to it so cookies stay same-origin.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
});
