import type { ReactNode } from "react";
import { useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ShelbyClientProvider } from "@shelby-protocol/react";
import { wagmiConfig } from "@/lib/chains/wagmiConfig";
import { SOLANA_ENDPOINT } from "@/lib/chains/solanaConfig";
import { shelbyClient } from "@/lib/shelby/client";

/** All three wallet ecosystems mounted simultaneously and independently —
 * each provider only manages its own connection lifecycle; nothing here
 * couples Aptos/Ethereum/Solana state together (that happens in the
 * per-chain sync hooks in features/wallet). autoConnect on each provider
 * gives silent reconnect across page reloads. */
export function AppProviders({ children }: { children: ReactNode }) {
  const solanaWallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <AptosWalletAdapterProvider autoConnect>
        <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
          <WalletProvider wallets={solanaWallets} autoConnect>
            <ShelbyClientProvider client={shelbyClient}>{children}</ShelbyClientProvider>
          </WalletProvider>
        </ConnectionProvider>
      </AptosWalletAdapterProvider>
    </WagmiProvider>
  );
}
