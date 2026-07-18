import { create } from "zustand";
import type { ChainId } from "@/types";
import type { WalletAdapterSigner } from "@shelby-protocol/react";

export interface WalletConnectionState {
  address: string | null;
  storageAccountAddress: string | null;
  connecting: boolean;
  error: string | null;
  signer: WalletAdapterSigner | null;
}

const emptyConnection: WalletConnectionState = {
  address: null,
  storageAccountAddress: null,
  connecting: false,
  error: null,
  signer: null,
};

interface ChainHandlers {
  connect: () => void | Promise<void>;
  disconnect: () => void | Promise<void>;
}

interface WalletStoreState {
  connections: Record<ChainId, WalletConnectionState>;
  handlers: Partial<Record<ChainId, ChainHandlers>>;
  connectModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  setConnection: (chain: ChainId, patch: Partial<WalletConnectionState>) => void;
  registerHandlers: (chain: ChainId, handlers: ChainHandlers) => void;
  connect: (chain: ChainId) => void;
  disconnect: (chain: ChainId) => void;
  disconnectAll: () => void;
}

/**
 * A thin mirror over the three real wallet SDKs (Aptos wallet-adapter,
 * wagmi, Solana wallet-adapter) — see features/wallet/WalletSync.tsx, which
 * is the only writer of `connections` and `handlers`. Components read this
 * store for a unified cross-chain view; connect/disconnect here just
 * delegate to whichever real hook registered itself for that chain.
 */
export const useWalletStore = create<WalletStoreState>((set, get) => ({
  connections: {
    aptos: { ...emptyConnection },
    ethereum: { ...emptyConnection },
    solana: { ...emptyConnection },
  },
  handlers: {},
  connectModalOpen: false,
  openConnectModal: () => set({ connectModalOpen: true }),
  closeConnectModal: () => set({ connectModalOpen: false }),
  setConnection: (chain, patch) =>
    set((state) => ({
      connections: { ...state.connections, [chain]: { ...state.connections[chain], ...patch } },
    })),
  registerHandlers: (chain, handlers) => set((state) => ({ handlers: { ...state.handlers, [chain]: handlers } })),
  connect: (chain) => {
    const handler = get().handlers[chain];
    if (!handler) return;
    get().setConnection(chain, { error: null });
    Promise.resolve()
      .then(() => handler.connect())
      .catch((err: unknown) => {
        get().setConnection(chain, { error: err instanceof Error ? err.message : String(err) });
      });
  },
  disconnect: (chain) => {
    void get().handlers[chain]?.disconnect();
  },
  disconnectAll: () => {
    for (const chain of Object.keys(get().handlers) as ChainId[]) {
      void get().handlers[chain]?.disconnect();
    }
  },
}));

export function useIsAnyWalletConnected() {
  return useWalletStore((s) => Object.values(s.connections).some((c) => c.address !== null));
}

/** First connected wallet address, in aptos → ethereum → solana priority —
 * used as the current user/creator identity wherever a single address is needed. */
export function useConnectedAddress() {
  return useWalletStore((s) => s.connections.aptos.address ?? s.connections.ethereum.address ?? s.connections.solana.address);
}
