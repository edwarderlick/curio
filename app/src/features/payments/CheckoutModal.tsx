import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { ChainId, Creator, LectureDetail, UnlockGrant } from "@/types";
import { useWalletStore } from "@/features/wallet/store";
import { usePriceStore } from "@/lib/chains/priceStore";
import { getExplorerTxUrl } from "@/lib/chains/explorer";
import { recordUnlockGrant } from "@/lib/index/catalogClient";
import { useAptosPayment } from "./useAptosPayment";
import { useEthereumPayment } from "./useEthereumPayment";
import { useSolanaPayment } from "./useSolanaPayment";

interface CheckoutModalProps {
  lecture: LectureDetail;
  creator: Creator | null;
  open: boolean;
  onClose: () => void;
}

const CHAIN_META: Record<ChainId, { label: string; icon: string; decimals: number; symbol: string }> = {
  aptos: { label: "Aptos", icon: "token", decimals: 2, symbol: "APT" },
  ethereum: { label: "Ethereum", icon: "hexagon", decimals: 4, symbol: "ETH" },
  solana: { label: "Solana", icon: "bolt", decimals: 3, symbol: "SOL" },
};

type CheckoutState = { status: "idle" } | { status: "pending" } | { status: "success"; txHash: string } | { status: "insufficient" } | { status: "failed"; message: string };

function classifyError(err: unknown): CheckoutState {
  const message = err instanceof Error ? err.message : String(err);
  if (/insufficient|not enough|exceeds balance/i.test(message)) return { status: "insufficient" };
  return { status: "failed", message };
}

export function CheckoutModal({ lecture, creator, open, onClose }: CheckoutModalProps) {
  const queryClient = useQueryClient();
  const connections = useWalletStore((s) => s.connections);
  const rates = usePriceStore((s) => s.usdRates);
  const aptosPay = useAptosPayment();
  const ethereumPay = useEthereumPayment();
  const solanaPay = useSolanaPayment();

  const payableChains = useMemo(() => {
    return (Object.keys(CHAIN_META) as ChainId[]).filter(
      (chain) => connections[chain].address && creator?.payoutAddress[chain] && rates[chain],
    );
  }, [connections, creator, rates]);

  const [selectedChain, setSelectedChain] = useState<ChainId | null>(payableChains[0] ?? null);
  const chain = selectedChain && payableChains.includes(selectedChain) ? selectedChain : payableChains[0] ?? null;
  const [state, setState] = useState<CheckoutState>({ status: "idle" });

  const nativeAmount = chain && rates[chain] ? lecture.price.usd / (rates[chain] as number) : null;

  async function handlePay() {
    if (!chain || nativeAmount == null || !creator?.payoutAddress[chain]) return;
    const recipient = creator.payoutAddress[chain] as string;
    const walletAddress = connections[chain].address as string;
    setState({ status: "pending" });
    try {
      let txHash: string;
      if (chain === "aptos") txHash = await aptosPay.pay(recipient, nativeAmount);
      else if (chain === "ethereum") txHash = await ethereumPay.pay(recipient, nativeAmount);
      else txHash = await solanaPay.pay(recipient, nativeAmount);

      const grant: UnlockGrant = {
        lectureId: lecture.id,
        walletAddress,
        chain,
        txHash,
        amount: lecture.price.usd,
        unlockedAt: new Date().toISOString(),
      };
      await recordUnlockGrant(grant);
      await queryClient.invalidateQueries({ queryKey: ["unlock-grants"] });
      setState({ status: "success", txHash });
    } catch (err) {
      setState(classifyError(err));
    }
  }

  function handleClose() {
    if (state.status !== "pending") {
      setState({ status: "idle" });
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-8">
        <h2 className="font-headline-lg text-headline-lg text-white mb-2">Unlock Lecture</h2>
        <p className="text-on-surface-variant font-body-md mb-6">{lecture.title}</p>

        {state.status === "success" ? (
          <div className="rounded-2xl bg-secondary-container/10 border border-secondary-container/30 p-6 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-secondary-fixed">check_circle</span>
            <p className="font-bold text-white">Unlocked!</p>
            <a
              href={getExplorerTxUrl(chain as ChainId, state.txHash)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1 text-primary font-label-sm text-label-sm hover:underline"
            >
              View transaction
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : payableChains.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-high p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">link_off</span>
            <p className="text-on-surface-variant font-body-md">
              {creator ? "Connect a wallet on a chain this creator accepts payment on." : "Creator payout details unavailable."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2">
              {payableChains.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedChain(c)}
                  disabled={state.status === "pending"}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border font-label-sm text-label-sm transition-all ${
                    chain === c ? "bg-primary-container/20 border-primary-container/40 text-primary" : "bg-surface-variant border-white/5 text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{CHAIN_META[c].icon}</span>
                  {CHAIN_META[c].label}
                </button>
              ))}
            </div>

            {chain && nativeAmount != null && (
              <div className="rounded-2xl bg-surface-container-high p-6 text-center">
                <p className="font-display-lg text-display-lg text-white">
                  {nativeAmount.toFixed(CHAIN_META[chain].decimals)} {CHAIN_META[chain].symbol}
                </p>
                <p className="text-on-surface-variant font-label-sm text-label-sm mt-1">≈ ${lecture.price.usd.toFixed(2)} USD</p>
              </div>
            )}

            {state.status === "insufficient" && (
              <p className="text-error font-label-sm text-label-sm text-center">Insufficient balance on this wallet. Fund it and try again.</p>
            )}
            {state.status === "failed" && <p className="text-error font-label-sm text-label-sm text-center break-words">{state.message}</p>}

            <Button className="w-full" size="lg" loading={state.status === "pending"} disabled={!chain} onClick={handlePay}>
              {state.status === "pending" ? "Confirm in wallet..." : `Pay with ${chain ? CHAIN_META[chain].label : "wallet"}`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
