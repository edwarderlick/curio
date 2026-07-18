import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Verifies an unlock-grant's claimed transaction actually happened on-chain
 * before the grant is persisted. Without this, `POST /api/catalog/unlock-grants`
 * would accept any client-supplied txHash at face value — anyone could unlock
 * any paid lecture for free by POSTing a fabricated or reused hash directly,
 * bypassing the checkout flow entirely.
 *
 * This checks the transaction is real, succeeded, moved funds from the
 * claimed sender to the claimed recipient, and transferred a non-zero
 * amount. It intentionally does NOT check the exact amount matches the
 * lecture's USD price — that would require a live price oracle server-side,
 * which is out of scope here — so it stops fabrication/replay-under-a-
 * different-wallet, not underpayment.
 */

const aptos = new Aptos(new AptosConfig({ network: Network.SHELBYNET, fullnode: process.env.APTOS_FULLNODE }));
const ethClient = createPublicClient({ chain: sepolia, transport: http() });
const solConnection = new Connection(process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl("devnet"), "confirmed");

interface VerifyParams {
  txHash: string;
  sender: string;
  recipient: string;
}

async function verifyAptosTransfer({ txHash, sender, recipient }: VerifyParams): Promise<boolean> {
  try {
    const txn = await aptos.getTransactionByHash({ transactionHash: txHash });
    if (!("success" in txn) || !txn.success) return false;
    if (!("sender" in txn) || txn.sender.toLowerCase() !== sender.toLowerCase()) return false;
    if (!("payload" in txn)) return false;
    const payload = txn.payload as { function?: string; arguments?: unknown[] };
    if (payload.function !== "0x1::aptos_account::transfer" && payload.function !== "0x1::coin::transfer") return false;
    const [recipientArg, amountArg] = payload.arguments ?? [];
    if (typeof recipientArg !== "string" || recipientArg.toLowerCase() !== recipient.toLowerCase()) return false;
    if (!(Number(amountArg) > 0)) return false;
    return true;
  } catch {
    return false;
  }
}

async function verifyEthereumTransfer({ txHash, sender, recipient }: VerifyParams): Promise<boolean> {
  try {
    const hash = txHash as `0x${string}`;
    const receipt = await ethClient.getTransactionReceipt({ hash });
    if (receipt.status !== "success") return false;
    const tx = await ethClient.getTransaction({ hash });
    if (tx.from.toLowerCase() !== sender.toLowerCase()) return false;
    if (!tx.to || tx.to.toLowerCase() !== recipient.toLowerCase()) return false;
    if (!(tx.value > 0n)) return false;
    return true;
  } catch {
    return false;
  }
}

async function verifySolanaTransfer({ txHash, sender, recipient }: VerifyParams): Promise<boolean> {
  try {
    const tx = await solConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    if (!tx || tx.meta?.err) return false;
    const instructions = tx.transaction.message.instructions;
    const transferIx = instructions.find(
      (ix): ix is typeof ix & { parsed: { type: string; info: { source: string; destination: string; lamports: number } } } =>
        "parsed" in ix && ix.program === "system" && ix.parsed?.type === "transfer",
    );
    if (!transferIx) return false;
    const { source, destination, lamports } = transferIx.parsed.info;
    if (source !== sender) return false;
    if (destination !== recipient) return false;
    if (!(lamports > 0)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function verifyOnChainTransfer(chain: "aptos" | "ethereum" | "solana", params: VerifyParams): Promise<boolean> {
  if (chain === "aptos") return verifyAptosTransfer(params);
  if (chain === "ethereum") return verifyEthereumTransfer(params);
  return verifySolanaTransfer(params);
}
