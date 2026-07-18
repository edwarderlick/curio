import { useEffect } from "react";
import { useWalletStore } from "./store";
import { useAptosWallet } from "./aptos";
import { useEthereumWallet } from "./ethereum";
import { useSolanaWallet } from "./solana";

/** Mounted once at the app root, inside every wallet provider. Mirrors the
 * three real wallet hooks into useWalletStore so any component can read a
 * unified connection view without touching wagmi/Aptos/Solana APIs directly. */
export function WalletSync() {
  const setConnection = useWalletStore((s) => s.setConnection);
  const registerHandlers = useWalletStore((s) => s.registerHandlers);

  const aptos = useAptosWallet();
  const ethereum = useEthereumWallet();
  const solana = useSolanaWallet();

  useEffect(() => {
    setConnection("aptos", {
      address: aptos.address,
      storageAccountAddress: aptos.storageAccountAddress,
      connecting: aptos.connecting,
      signer: aptos.signer,
    });
    registerHandlers("aptos", { connect: aptos.connect, disconnect: aptos.disconnect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptos.address, aptos.storageAccountAddress, aptos.connecting, aptos.signer]);

  useEffect(() => {
    setConnection("ethereum", {
      address: ethereum.address,
      storageAccountAddress: ethereum.storageAccountAddress,
      connecting: ethereum.connecting,
      error: ethereum.error,
      signer: ethereum.signer,
    });
    registerHandlers("ethereum", { connect: ethereum.connect, disconnect: ethereum.disconnect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ethereum.address, ethereum.storageAccountAddress, ethereum.connecting, ethereum.error, ethereum.signer]);

  useEffect(() => {
    setConnection("solana", {
      address: solana.address,
      storageAccountAddress: solana.storageAccountAddress,
      connecting: solana.connecting,
      signer: solana.signer,
    });
    registerHandlers("solana", { connect: solana.connect, disconnect: solana.disconnect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solana.address, solana.storageAccountAddress, solana.connecting, solana.signer]);

  return null;
}
