import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Ethereum side of DAA runs on Sepolia rather than mainnet: real checkout
 * transactions (Step 8) move real-ish ETH, and this is a dev-facing demo —
 * asking testers to spend mainnet funds would be irresponsible. Swap to
 * `mainnet` here (and in the Chip that displays the network name) to go live.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});

export const ETHEREUM_NETWORK_LABEL = "Sepolia";
