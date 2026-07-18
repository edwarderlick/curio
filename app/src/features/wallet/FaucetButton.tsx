import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/Button";
import { shelbyClient } from "@/lib/shelby/client";
import type { ChainId } from "@/types";

const SEPOLIA_FAUCET_URL = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";
// Matches the amount shown in the SDK's own fundAccountWithAPT/fundAccountWithShelbyUSD examples.
const SHELBYNET_FAUCET_AMOUNT = 100_000_000;

interface FaucetButtonProps {
  chain: ChainId;
  address: string;
}

/**
 * Real testnet funding, not just a link out. Aptos (Shelbynet) and Solana
 * (Devnet) both expose a programmatic faucet the SDKs can call directly for
 * any address, so those fund in one click. Sepolia ETH has no reliable
 * no-API-key programmatic faucet, so that one stays an outbound link.
 */
export function FaucetButton({ chain, address }: FaucetButtonProps) {
  const { connection } = useConnection();
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (chain === "ethereum") {
    return (
      <a href={SEPOLIA_FAUCET_URL} target="_blank" rel="noreferrer" className="font-label-sm text-label-sm text-primary hover:underline">
        Get Sepolia ETH
      </a>
    );
  }

  async function handleFund() {
    setState("pending");
    setMessage(null);
    try {
      if (chain === "aptos") {
        await Promise.all([
          shelbyClient.fundAccountWithAPT({ address, amount: SHELBYNET_FAUCET_AMOUNT }),
          shelbyClient.fundAccountWithShelbyUSD({ address, amount: SHELBYNET_FAUCET_AMOUNT }),
        ]);
      } else {
        const signature = await connection.requestAirdrop(new PublicKey(address), LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature, "confirmed");
      }
      setState("success");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" loading={state === "pending"} onClick={handleFund}>
        Get testnet funds
      </Button>
      {state === "success" && <span className="text-secondary-fixed font-label-sm text-label-sm">Funded</span>}
      {state === "error" && message && <span className="text-error font-label-sm text-label-sm max-w-48 text-right break-words">{message}</span>}
    </div>
  );
}
