import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWalletStore, type WalletConnectionState } from "@/features/wallet/store";
import { FaucetButton } from "@/features/wallet/FaucetButton";
import type { ChainId } from "@/types";

const CHAIN_META: Record<ChainId, { label: string; icon: string; tone: string }> = {
  aptos: { label: "Aptos", icon: "token", tone: "text-secondary-fixed" },
  ethereum: { label: "Ethereum", icon: "hexagon", tone: "text-tertiary" },
  solana: { label: "Solana", icon: "bolt", tone: "text-tertiary" },
};

function ChainRow({ chain, state }: { chain: ChainId; state: WalletConnectionState }) {
  const meta = CHAIN_META[chain];
  const connected = Boolean(state.address);

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-high border border-white/5">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-2xl ${meta.tone}`}>{meta.icon}</span>
        <div>
          <p className="font-bold text-white">{meta.label}</p>
          {connected ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {state.address?.slice(0, 6)}...{state.address?.slice(-4)}
            </p>
          ) : state.error ? (
            <p className="font-label-sm text-label-sm text-error">{state.error}</p>
          ) : (
            <p className="font-label-sm text-label-sm text-on-surface-variant">Not connected</p>
          )}
        </div>
      </div>
      <ChainConnectAction chain={chain} state={state} />
    </div>
  );
}

function ChainConnectAction({ chain, state }: { chain: ChainId; state: WalletConnectionState }) {
  const disconnect = useWalletStore((s) => s.disconnect);
  const connected = Boolean(state.address);

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <FaucetButton chain={chain} address={state.address as string} />
        <Button variant="ghost" size="sm" onClick={() => disconnect(chain)}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <ConnectButton chain={chain} loading={state.connecting} />
  );
}

function ConnectButton({ chain, loading }: { chain: ChainId; loading: boolean }) {
  const connect = useWalletStore((s) => s.connect);
  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={() => connect(chain)}>
      Connect
    </Button>
  );
}

export function WalletConnectModal() {
  const open = useWalletStore((s) => s.connectModalOpen);
  const close = useWalletStore((s) => s.closeConnectModal);
  const connections = useWalletStore((s) => s.connections);
  const disconnectAll = useWalletStore((s) => s.disconnectAll);
  const anyConnected = Object.values(connections).some((c) => c.address);

  return (
    <Modal open={open} onClose={close} maxWidth="max-w-md">
      <div className="p-8">
        <h2 className="font-headline-lg text-headline-lg text-white mb-2">Connect Wallet</h2>
        <p className="text-on-surface-variant font-body-md mb-6">
          Connect Aptos, Ethereum, and Solana wallets independently. Each derives its own Shelby storage account.
        </p>
        <div className="space-y-3">
          {(Object.keys(CHAIN_META) as ChainId[]).map((chain) => (
            <ChainRow key={chain} chain={chain} state={connections[chain]} />
          ))}
        </div>
        {anyConnected && (
          <button
            onClick={disconnectAll}
            className="w-full mt-6 text-center font-label-sm text-label-sm text-error hover:underline"
          >
            Disconnect all
          </button>
        )}
      </div>
    </Modal>
  );
}
