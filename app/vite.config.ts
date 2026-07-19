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
  // No dev proxy: /api/* is now Vercel serverless functions (see api/),
  // same-origin with the app in production. For local full-stack dev
  // (functions + Vite together), run `vercel dev` from this directory
  // instead of `vite dev` directly — see ../DEPLOY.md.
  build: {
    rolldownOptions: {
      output: {
        // Split the heaviest per-ecosystem SDKs into their own cacheable
        // chunks — routes not touching a given chain don't need to wait on it.
        codeSplitting: {
          groups: [
            { name: "vendor-solana", test: /node_modules\/@solana\// },
            { name: "vendor-wagmi", test: /node_modules\/(wagmi|viem|@wagmi)\// },
            { name: "vendor-aptos", test: /node_modules\/@aptos-labs\// },
          ],
        },
      },
    },
  },
});
