import { useCallback } from "react";
import { useWalletStore } from "@/features/wallet/store";

const OCTAS_PER_APT = 1e8;

/** Real APT transfer on Shelbynet via `0x1::aptos_account::transfer`, signed
 * by whichever signer is connected for the "aptos" chain slot — native
 * Aptos wallet, or a DAA-derived Ethereum/Solana storage account (they're
 * all Aptos accounts under the hood, so this entry function works for any
 * of them). */
export function useAptosPayment() {
  const signer = useWalletStore((s) => s.connections.aptos.signer);

  const pay = useCallback(
    async (recipient: string, amountApt: number): Promise<string> => {
      if (!signer) throw new Error("Aptos wallet not connected");
      const amountOctas = Math.round(amountApt * OCTAS_PER_APT);
      const result = await signer.signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [recipient, amountOctas],
        },
      });
      return result.hash;
    },
    [signer],
  );

  return { pay, ready: Boolean(signer) };
}
