import { useCallback, useMemo } from "react";
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

  const address = account?.address?.toString() ?? null;

  // Memoized like the Ethereum/Solana signers (ethereum.ts, solana.ts), and
  // keyed on the stable address *string* rather than the raw `account`
  // object — the adapter hands back a new `account` object on every render
  // regardless of whether the connection actually changed, so memoizing on
  // it directly wouldn't memoize anything. An unmemoized signer here is a
  // new reference on every render, which the WalletSync effect downstream
  // keys off of, and which Zustand-store consumers see as "changed" on
  // every single render even when nothing about the connection changed.
  // Combined with a selector that itself returns a fresh object (see
  // useStorageSigner in wallet/store.ts), that's enough to cascade into a
  // real infinite render loop — confirmed live via a React "Maximum update
  // depth exceeded" crash during the upload flow's wallet signature prompt.
  const signer: WalletAdapterSigner | null = useMemo(
    () => (account ? { account: account.address, signAndSubmitTransaction } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the
    // derived `address` string on purpose, not the unstable `account` object
    [address, signAndSubmitTransaction],
  );

  return {
    address,
    storageAccountAddress: address,
    connected,
    connecting: isLoading,
    connect: doConnect,
    disconnect,
    signer,
  };
}
