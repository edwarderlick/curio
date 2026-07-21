import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Verifies an unlock-grant's claimed transaction actually happened on-chain
 * before the grant is persisted. Without this, `POST /api/catalog/unlock-grants`
 * would accept any client-supplied txHash at face value — anyone could unlock
 * any paid lecture for free by POSTing a fabricated or reused hash directly,
 * bypassing the checkout flow entirely. This is why this check has to stay a
 * server-side (serverless function) call rather than move to the browser.
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
const solanaRpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

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

interface ParsedInstruction {
  program?: string;
  parsed?: { type?: string; info?: { source?: string; destination?: string; lamports?: number } };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Plain JSON-RPC `getTransaction` call instead of @solana/web3.js's
 * `Connection.getParsedTransaction` — importing @solana/web3.js here pulls
 * in `rpc-websockets` (its account-subscription machinery, unused for this
 * one read-only call), which has a broken CJS/ESM interop with a newer
 * `uuid` under Vercel's Node runtime (`ERR_REQUIRE_ESM`) and crashes this
 * whole module at import time — confirmed live via Vercel's function logs,
 * taking down every unlock-grants request (all chains, not just Solana)
 * with it. A raw `fetch` avoids the dependency entirely; the RPC response
 * shape with `encoding: "jsonParsed"` is exactly what the SDK wrapped.
 *
 * Retries only on "not found yet", not on every failure: the client
 * confirms the payment against this same default endpoint
 * (clusterApiUrl("devnet") client-side, same public devnet RPC server-side
 * when SOLANA_RPC_ENDPOINT is unset) before this ever runs, so a `null`
 * result here isn't "the transaction doesn't exist" — it's Solana's public
 * devnet RPC (well-documented as rate-limited/inconsistent) not yet having
 * indexed a transaction that was confirmed moments ago, sometimes landing
 * on a different backend node than the one that served the confirmation.
 * Confirmed live: a real payment the client successfully confirmed still
 * 402'd on the very next request. A definitive mismatch (wrong sender,
 * wrong recipient, zero amount, an actual on-chain failure) means the
 * claim is simply wrong and waiting won't change that — only "not found"
 * gets retried, so a fabricated hash still fails fast instead of costing
 * 4x the latency.
 */
async function verifySolanaTransfer(params: VerifyParams): Promise<boolean> {
  const attempts = 4;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(750 * attempt);
    const outcome = await verifySolanaTransferOnce(params);
    if (outcome === "verified") return true;
    if (outcome === "invalid") return false;
  }
  return false;
}

type SolanaVerifyOutcome = "verified" | "not-found" | "invalid";

async function verifySolanaTransferOnce({ txHash, sender, recipient }: VerifyParams): Promise<SolanaVerifyOutcome> {
  try {
    const res = await fetch(solanaRpcEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [txHash, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }),
    });
    const { result } = (await res.json()) as {
      result: { meta?: { err: unknown }; transaction: { message: { instructions: ParsedInstruction[] } } } | null;
    };
    if (!result) return "not-found";
    if (result.meta?.err) return "invalid";
    const transferIx = result.transaction.message.instructions.find((ix) => ix.program === "system" && ix.parsed?.type === "transfer");
    const info = transferIx?.parsed?.info;
    if (!info) return "invalid";
    if (info.source !== sender) return "invalid";
    if (info.destination !== recipient) return "invalid";
    if (!(info.lamports && info.lamports > 0)) return "invalid";
    return "verified";
  } catch {
    // A network/parse error against a flaky public RPC is transient, same
    // as "not found" — worth a retry rather than failing the claim outright.
    return "not-found";
  }
}

export async function verifyOnChainTransfer(chain: "aptos" | "ethereum" | "solana", params: VerifyParams): Promise<boolean> {
  if (chain === "aptos") return verifyAptosTransfer(params);
  if (chain === "ethereum") return verifyEthereumTransfer(params);
  return verifySolanaTransfer(params);
}
