import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

/** Real native SOL transfer on Devnet (see solanaConfig.ts) via the
 * connected wallet-adapter — independent of the Shelby DAA signer. */
export function useSolanaPayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const pay = useCallback(
    async (recipient: string, amountSol: number): Promise<string> => {
      if (!publicKey) throw new Error("Solana wallet not connected");
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
        }),
      );
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    },
    [publicKey, sendTransaction, connection],
  );

  return { pay, ready: Boolean(publicKey) };
}
