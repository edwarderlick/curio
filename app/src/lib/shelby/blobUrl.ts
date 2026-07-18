/**
 * Direct Shelby RPC blob read URL: `<rpcEndpoint>/v1/blobs/<account>/<blobName>`.
 * The RPC supports plain HTTP GET plus range requests, which is exactly what
 * an HLS/DASH player needs for adaptive segment fetches.
 *
 * v1 note: access control here is enforced at the app layer (the Player
 * route only renders once we've confirmed a real unlock-grant record for the
 * connected wallet) rather than at the Shelby storage layer itself — Shelby's
 * pay-per-read micropayment-channel mechanism isn't fully documented yet for
 * client-side streaming reads. TODO(v2): move gating to signed/session reads.
 */
export function getBlobUrl(manifestPath: string): string {
  const rpcEndpoint = import.meta.env.VITE_SHELBY_RPC_ENDPOINT.replace(/\/$/, "");
  return `${rpcEndpoint}/v1/blobs/${manifestPath}`;
}
