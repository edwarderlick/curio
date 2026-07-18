import { useCallback } from "react";
import { useWallet as useAptosAdapter } from "@aptos-labs/wallet-adapter-react";
import { WalletReadyState } from "@aptos-labs/wallet-adapter-core";
import type { WalletAdapterSigner } from "@shelby-protocol/react";

/** Native Aptos wallets (Petra, etc.) sign directly as themselves — no DAA
 * derivation needed, unlike the Ethereum/Solana kits. */
export function useAptosWallet() {
  const { account, connected, isLoading, connect, disconnect, wallets, signAndSubmitTransaction } = useAptosAdapter();

  const doConnect = useCallback(() => {
    const installed = wallets.filter((w) => w.readyState === WalletReadyState.Installed);
    // The adapter always lists a built-in "sign in with Google" keyless
    // option as installed, alongside real extensions — prefer an actual
    // extension (Petra) over it when both are available, so connecting
    // doesn't randomly land on the Google flow instead of the extension.
    const target = installed.find((w) => w.name.toLowerCase().includes("petra")) ?? installed[0];
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
