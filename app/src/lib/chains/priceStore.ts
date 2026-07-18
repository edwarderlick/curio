import { create } from "zustand";
import type { ChainId } from "@/types";

interface PriceState {
  usdRates: Partial<Record<ChainId, number>>;
  lastUpdated: number | null;
  setRates: (rates: Partial<Record<ChainId, number>>) => void;
}

/** Live USD/native-token rates, populated by useLivePrices (CoinGecko public API). */
export const usePriceStore = create<PriceState>((set) => ({
  usdRates: {},
  lastUpdated: null,
  setRates: (rates) => set({ usdRates: rates, lastUpdated: Date.now() }),
}));
