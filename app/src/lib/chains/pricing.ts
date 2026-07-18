import type { ChainId, Price } from "@/types";
import { usePriceStore } from "./priceStore";

const SYMBOLS: Record<ChainId, string> = {
  aptos: "APT",
  ethereum: "ETH",
  solana: "SOL",
};

const DECIMALS: Record<ChainId, number> = {
  aptos: 2,
  ethereum: 4,
  solana: 3,
};

/** Reads the live rate from usePriceStore (populated by useLivePrices).
 * Falls back to a "—" native amount if the feed hasn't loaded yet rather
 * than fabricating a rate. */
export function useChainPrice(price: Price, chain: ChainId) {
  const rate = usePriceStore((s) => s.usdRates[chain]);
  if (!rate) {
    return { native: "—", usd: `≈ $${price.usd.toFixed(2)} USD` };
  }
  const nativeAmount = price.usd / rate;
  return {
    native: `${nativeAmount.toFixed(DECIMALS[chain])} ${SYMBOLS[chain]}`,
    usd: `≈ $${price.usd.toFixed(2)} USD`,
  };
}
