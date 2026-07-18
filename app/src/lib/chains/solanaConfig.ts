import { clusterApiUrl } from "@solana/web3.js";

/** Same reasoning as wagmiConfig.ts: Devnet, not mainnet-beta, for a dev demo. */
export const SOLANA_CLUSTER = "devnet" as const;
export const SOLANA_ENDPOINT = clusterApiUrl(SOLANA_CLUSTER);
export const SOLANA_NETWORK_LABEL = "Devnet";
