import { useCallback } from "react";
import { useWallet as useAptosAdapter } from "@aptos-labs/wallet-adapter-react";
import { WalletReadyState } from "@aptos-labs/wallet-adapter-core";
import type { WalletAdapterSigner } from "@shelby-protocol/react";

/** Native Aptos wallets (Petra, etc.) sign directly as themselves — no DAA
 * derivation needed, unlike the Ethereum/Solana kits. */
export function useAptosWallet() {
  const { account, connected, isLoading, connect, disconnect, wallets, signAndSubmitTransaction } = useAptosAdapter();

  const doConnect = useCallback(() => {
    const target = wallets.find((w) => w.readyState === WalletReadyState.Installed);
    if (!target) throw new Error("No Aptos wallet detected — install Petra or another Aptos wallet.");
    connect(target.name);
  }, [wallets, connect]);

  const signer: WalletAdapterSigner | null = account ? { account: account.address, signAndSubmitTransaction } : null;

  return {
    address: account?.address?.toString() ?? null,
    storageAccountAddress: account?.address?.toString() ?? null,
    connected,
    connecting: isLoading,
    connect: doConnect,
    disconnect,
    signer,
  };
}
