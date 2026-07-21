import { useCallback } from "react";
import { useSendTransaction } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther } from "viem";

/** Real native ETH transfer on Sepolia (see wagmiConfig.ts for why not
 * mainnet) — this is a normal EOA-to-EOA transfer via wagmi, independent of
 * the Shelby DAA signer (which only handles Aptos-side Shelby operations).
 *
 * `chainId` is required here, not optional: without it, wagmi sends on
 * whatever network the wallet currently has active rather than forcing
 * Sepolia — `wagmiConfig.ts`'s `chains: [sepolia]` only scopes which chains
 * wagmi's own read clients know about, it doesn't constrain sendTransaction.
 * Confirmed live: a payment silently went out on Arbitrum Sepolia (the
 * wallet's then-active network) instead, which server-side verification
 * — pinned to plain Ethereum Sepolia in paymentVerify.ts — could never
 * find, failing with a 402 despite the wallet showing "Confirmed". Passing
 * `chainId` makes wagmi request a chain switch (or throw a clear error)
 * instead of silently submitting on the wrong chain. */
export function useEthereumPayment() {
  const { sendTransactionAsync } = useSendTransaction();

  const pay = useCallback(
    async (recipient: string, amountEth: number): Promise<string> => {
      const hash = await sendTransactionAsync({
        to: recipient as `0x${string}`,
        value: parseEther(amountEth.toString()),
        chainId: sepolia.id,
      });
      return hash;
    },
    [sendTransactionAsync],
  );

  return { pay };
}
