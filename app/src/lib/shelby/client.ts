import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

/** Single browser-side Shelby client, targeting Shelbynet — the only fully
 * operational Shelby network today (Shelby's own docs list testnet "TBD"). */
export const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
  apiKey: import.meta.env.VITE_SHELBY_API_KEY || undefined,
});
