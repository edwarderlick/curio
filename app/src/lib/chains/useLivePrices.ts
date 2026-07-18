import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePriceStore } from "./priceStore";
import type { ChainId } from "@/types";

const COINGECKO_IDS: Record<ChainId, string> = {
  aptos: "aptos",
  ethereum: "ethereum",
  solana: "solana",
};

async function fetchRates(): Promise<Partial<Record<ChainId, number>>> {
  const ids = Object.values(COINGECKO_IDS).join(",");
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
  if (!res.ok) throw new Error(`CoinGecko rate fetch failed: ${res.status}`);
  const data: Record<string, { usd: number }> = await res.json();
  const rates: Partial<Record<ChainId, number>> = {};
  for (const [chain, id] of Object.entries(COINGECKO_IDS) as [ChainId, string][]) {
    if (data[id]?.usd) rates[chain] = data[id].usd;
  }
  return rates;
}

/** Mounted once at the app root — keeps the price store fresh from a real
 * public feed so lecture prices convert to APT/ETH/SOL with live rates. */
export function useLivePrices() {
  const setRates = usePriceStore((s) => s.setRates);
  const query = useQuery({
    queryKey: ["chain-usd-rates"],
    queryFn: fetchRates,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setRates(query.data);
  }, [query.data, setRates]);

  return query;
}
