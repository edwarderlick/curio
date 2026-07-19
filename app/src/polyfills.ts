import { Buffer } from "buffer";

/**
 * NOT imported by main.tsx. This is compiled to a standalone classic
 * <script> (public/buffer-polyfill.js, via `npm run build:polyfill` — see
 * package.json) and loaded from index.html *before* the module-script
 * bundle, because @solana/web3.js and @shelby-protocol/sdk/browser read
 * `Buffer` at their own module top level, and an ordinary `import
 * './polyfills'` inside the app bundle can't reliably guarantee it runs
 * before them once those deps are split into separate build chunks — see
 * the comment in index.html for the full reasoning.
 */
window.Buffer = window.Buffer ?? Buffer;
