/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHELBY_NETWORK: string;
  readonly VITE_SHELBY_RPC_ENDPOINT: string;
  readonly VITE_APTOS_FULLNODE: string;
  readonly VITE_APTOS_INDEXER: string;
  readonly VITE_SHELBY_API_KEY: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Buffer: typeof import("buffer").Buffer;
}
