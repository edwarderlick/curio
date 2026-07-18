import { Buffer } from "buffer";

// Must run before anything that transitively imports @solana/web3.js or
// @shelby-protocol/sdk/browser — those evaluate Buffer at module scope, so
// this has to be the very first import in main.tsx (ES module import order
// is depth-first in listed order; a later assignment in main.tsx's own body
// runs too late).
window.Buffer = window.Buffer ?? Buffer;
