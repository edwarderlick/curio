import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @solana/web3.js and friends expect Node's `global` — main.tsx polyfills Buffer.
  define: {
    global: "globalThis",
  },
  server: {
    proxy: {
      // Node-only transcode pipeline (system ffmpeg) lives in ../server —
      // see server/README for why this can't run in the browser.
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Split the heaviest per-ecosystem SDKs into their own cacheable
        // chunks — routes not touching a given chain/player don't need to
        // wait on it.
        codeSplitting: {
          groups: [
            { name: "vendor-solana", test: /node_modules\/@solana\// },
            { name: "vendor-wagmi", test: /node_modules\/(wagmi|viem|@wagmi)\// },
            { name: "vendor-aptos", test: /node_modules\/@aptos-labs\// },
            { name: "vendor-shaka", test: /node_modules\/(shaka-player|shaka-video-element|@shelby-protocol\/player)\// },
          ],
        },
      },
    },
  },
});
