import { useWalletStore } from "@/features/wallet/store";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { FaucetButton } from "@/features/wallet/FaucetButton";
import type { ChainId } from "@/types";
import { ETHEREUM_NETWORK_LABEL } from "@/lib/chains/wagmiConfig";
import { SOLANA_NETWORK_LABEL } from "@/lib/chains/solanaConfig";

const CHAIN_META: Record<ChainId, { label: string; icon: string; tone: string; network: string }> = {
  aptos: { label: "Aptos", icon: "token", tone: "text-secondary-fixed", network: "Shelbynet" },
  ethereum: { label: "Ethereum", icon: "hexagon", tone: "text-tertiary", network: ETHEREUM_NETWORK_LABEL },
  solana: { label: "Solana", icon: "bolt", tone: "text-tertiary", network: SOLANA_NETWORK_LABEL },
};

export function AccountSettingsPage() {
  const connections = useWalletStore((s) => s.connections);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);
  const disconnectAll = useWalletStore((s) => s.disconnectAll);
  const anyConnected = Object.values(connections).some((c) => c.address);

  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-white mb-2">Account / Wallet Settings</h1>
        <p className="text-on-surface-variant font-body-md">
          Manage your connected wallets. Each chain derives its own Shelby storage account independently. If you've
          already published as a creator, connecting a new chain here automatically links it as a payout address too
          — no extra step needed.
        </p>
      </div>

      <GlassPanel className="p-8 space-y-4">
        {(Object.keys(CHAIN_META) as ChainId[]).map((chain) => {
          const meta = CHAIN_META[chain];
          const state = connections[chain];
          const connected = Boolean(state.address);

          return (
            <div key={chain} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-high border border-white/5">
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined text-2xl ${meta.tone}`}>{meta.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{meta.label}</p>
                    <span className="text-[10px] font-label-sm uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">
                      {meta.network}
                    </span>
                  </div>
                  {connected ? (
                    <div className="space-y-0.5 mt-1">
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Wallet: {state.address?.slice(0, 8)}...{state.address?.slice(-6)}
                      </p>
                      {state.storageAccountAddress && state.storageAccountAddress !== state.address && (
                        <p className="font-label-sm text-label-sm text-secondary-fixed">
                          Shelby storage account: {state.storageAccountAddress.slice(0, 8)}...{state.storageAccountAddress.slice(-6)}
                        </p>
                      )}
                    </div>
                  ) : state.error ? (
                    <p className="font-label-sm text-label-sm text-error mt-1">{state.error}</p>
                  ) : (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Not connected</p>
                  )}
                </div>
              </div>
              {connected ? (
                <div className="flex items-center gap-2">
                  <FaucetButton chain={chain} address={state.address as string} />
                  <Button variant="ghost" size="sm" onClick={() => disconnect(chain)}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" loading={state.connecting} onClick={() => connect(chain)}>
                  Connect
                </Button>
              )}
            </div>
          );
        })}

        {anyConnected && (
          <button onClick={disconnectAll} className="w-full text-center font-label-sm text-label-sm text-error hover:underline pt-2">
            Disconnect all wallets
          </button>
        )}
      </GlassPanel>
    </div>
  );
}
