import { useCallback, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { useStorageAccount } from "@shelby-protocol/ethereum-kit/react";
import type { WalletAdapterSigner } from "@shelby-protocol/react";
import { shelbyClient } from "@/lib/shelby/client";

/** Ethereum wallets don't hold Shelby data directly — Derived Account
 * Abstraction (DAA) deterministically derives an Aptos storage account from
 * (ethereum address, dApp domain), authenticated via SIWE under the hood. */
export function useEthereumWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const { storageAccountAddress, signAndSubmitTransaction } = useStorageAccount({
    client: shelbyClient,
    wallet: walletClient,
  });

  const doConnect = useCallback(() => {
    const connector = connectors[0];
    if (!connector) throw new Error("No Ethereum wallet detected — install MetaMask or another injected wallet.");
    connect({ connector });
  }, [connectors, connect]);

  const signer: WalletAdapterSigner | null = useMemo(
    () => (storageAccountAddress ? { account: storageAccountAddress, signAndSubmitTransaction } : null),
    [storageAccountAddress, signAndSubmitTransaction],
  );

  return {
    address: address ?? null,
    storageAccountAddress: storageAccountAddress?.toString() ?? null,
    connected: isConnected,
    connecting: isConnecting,
    connect: doConnect,
    disconnect: () => disconnect(),
    error: error?.message ?? null,
    signer,
  };
}
