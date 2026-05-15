import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/echarts/") || id.includes("node_modules/echarts-for-react/") || id.includes("node_modules/zrender/")) {
            return "echarts";
          }
          if (id.includes("node_modules/maplibre-gl/")) {
            return "maplibre";
          }
        },
      },
    },
  },
});
