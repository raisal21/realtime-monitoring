import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev proxy target — derived from the WebSocket URL (same host, http(s)
  // scheme). Keeps /api/tiles same-origin so Layer 3 needs no CORS handling
  // (witsml NAPKIN 2026-05-20 — Security posture).
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_WS_URL ?? "ws://localhost:8080").replace(
    /^ws/,
    "http",
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
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
  };
});
