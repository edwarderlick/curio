import { useCallback } from "react";
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

/** Real native ETH transfer on Sepolia (see wagmiConfig.ts for why not
 * mainnet) — this is a normal EOA-to-EOA transfer via wagmi, independent of
 * the Shelby DAA signer (which only handles Aptos-side Shelby operations). */
export function useEthereumPayment() {
  const { sendTransactionAsync } = useSendTransaction();

  const pay = useCallback(
    async (recipient: string, amountEth: number): Promise<string> => {
      const hash = await sendTransactionAsync({
        to: recipient as `0x${string}`,
        value: parseEther(amountEth.toString()),
      });
      return hash;
    },
    [sendTransactionAsync],
  );

  return { pay };
}
