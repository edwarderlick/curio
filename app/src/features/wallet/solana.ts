import { useCallback, useMemo } from "react";
import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useStorageAccount } from "@shelby-protocol/solana-kit/react";
import type { SolanaWallet } from "@shelby-protocol/solana-kit/react";
import type { WalletAdapterSigner } from "@shelby-protocol/react";
import { shelbyClient } from "@/lib/shelby/client";

/** Solana wallets don't hold Shelby data directly — Derived Account
 * Abstraction (DAA) deterministically derives an Aptos storage account from
 * (solana pubkey, dApp domain), authenticated via SIWS under the hood. */
export function useSolanaWallet() {
  const { publicKey, connected, connecting, connect, disconnect, select, wallets, signMessage, signIn } = useSolanaAdapter();

  const adaptedWallet: SolanaWallet | null = useMemo(() => {
    if (!publicKey) return null;
    return { account: { address: publicKey }, signMessage, signIn };
  }, [publicKey, signMessage, signIn]);

  const { storageAccountAddress, signAndSubmitTransaction } = useStorageAccount({
    client: shelbyClient,
    wallet: adaptedWallet,
  });

  const doConnect = useCallback(async () => {
    const target = wallets.find((w) => w.readyState === WalletReadyState.Installed);
    if (!target) throw new Error("No Solana wallet detected — install Phantom or Solflare.");
    select(target.adapter.name);
    await connect();
  }, [wallets, select, connect]);

  const signer: WalletAdapterSigner | null = useMemo(
    () => (storageAccountAddress ? { account: storageAccountAddress, signAndSubmitTransaction } : null),
    [storageAccountAddress, signAndSubmitTransaction],
  );

  return {
    address: publicKey?.toString() ?? null,
    storageAccountAddress: storageAccountAddress?.toString() ?? null,
    connected,
    connecting,
    connect: doConnect,
    disconnect: () => disconnect(),
    signer,
  };
}
