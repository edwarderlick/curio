import { useMemo } from "react";
import { useConnectedAddress } from "@/features/wallet/store";
import { useLectures, useUnlockGrants } from "@/lib/index/hooks";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { getExplorerTxUrl } from "@/lib/chains/explorer";
import type { ChainId } from "@/types";

const CHAIN_LABEL: Record<ChainId, string> = { aptos: "Aptos", ethereum: "Ethereum", solana: "Solana" };

export function StudioEarningsPage() {
  const address = useConnectedAddress();
  const { data: lecturesData, isLoading: lecturesLoading } = useLectures(address ? { creatorId: address } : {});
  const { data: grants, isLoading: grantsLoading, isError, refetch } = useUnlockGrants({ creatorId: address ?? undefined });

  const lectureTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of lecturesData?.lectures ?? []) map.set(l.id, l.title);
    return map;
  }, [lecturesData]);

  const perChainTotals = useMemo(() => {
    const totals: Record<ChainId, number> = { aptos: 0, ethereum: 0, solana: 0 };
    for (const g of grants ?? []) totals[g.chain] += g.amount;
    return totals;
  }, [grants]);

  if (!address) {
    return (
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <EmptyState icon="account_balance_wallet" title="Connect a wallet" description="Earnings are scoped to your connected wallet's published lectures." />
      </div>
    );
  }

  if (lecturesLoading || grantsLoading) return <LoadingState title="Loading earnings" className="max-w-container-max-width mx-auto" />;
  if (isError) return <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} className="max-w-container-max-width mx-auto" />;

  const sortedGrants = [...(grants ?? [])].sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());

  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-8">
      <h1 className="font-headline-lg text-headline-lg text-white">Earnings & Payouts</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {(Object.keys(CHAIN_LABEL) as ChainId[]).map((chain) => (
          <GlassPanel key={chain} className="p-6">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{CHAIN_LABEL[chain]}</p>
            <p className="font-display-lg text-display-lg text-white">${perChainTotals[chain].toFixed(2)}</p>
          </GlassPanel>
        ))}
      </div>

      {sortedGrants.length === 0 ? (
        <EmptyState icon="payments" title="No unlocks yet" description="Recorded unlock transactions for your lectures will appear here." />
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="p-4">Lecture</th>
                <th className="p-4">Chain</th>
                <th className="p-4">Amount</th>
                <th className="p-4">When</th>
                <th className="p-4">Tx</th>
              </tr>
            </thead>
            <tbody>
              {sortedGrants.map((g) => (
                <tr key={g.txHash} className="border-b border-white/5">
                  <td className="p-4 text-white font-body-md truncate max-w-xs">{lectureTitles.get(g.lectureId) ?? g.lectureId}</td>
                  <td className="p-4 text-on-surface-variant font-label-sm text-label-sm">{CHAIN_LABEL[g.chain]}</td>
                  <td className="p-4 text-white font-body-md">${g.amount.toFixed(2)}</td>
                  <td className="p-4 text-on-surface-variant font-label-sm text-label-sm">{new Date(g.unlockedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <a href={getExplorerTxUrl(g.chain, g.txHash)} target="_blank" rel="noreferrer" className="text-primary font-label-sm text-label-sm hover:underline">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
