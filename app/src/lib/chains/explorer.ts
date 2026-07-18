import type { ChainId } from "@/types";

export function getExplorerTxUrl(chain: ChainId, txHash: string): string {
  switch (chain) {
    case "aptos":
      return `https://explorer.aptoslabs.com/txn/${txHash}?network=shelbynet`;
    case "ethereum":
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case "solana":
      return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  }
}
