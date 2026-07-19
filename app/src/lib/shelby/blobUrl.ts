import { Network } from "@aptos-labs/ts-sdk";
import { getShelbyAccountExplorerUrl } from "@shelby-protocol/sdk/browser";
import { API_BASE_URL } from "@/lib/apiBase";

/**
 * Proxied blob read URL — routes through app/api/stream (a `?path=` query
 * param, not a path segment — see the note on that handler for why) rather
 * than hitting Shelby's RPC directly from the browser. That's required, not
 * just nicer: the browser can't attach the Authorization header Shelby's
 * API-key auth needs on a plain <video>/<img> src (hard platform limit), so
 * unauthenticated direct reads hit Shelby's anonymous per-IP byte rate
 * limit fast — confirmed live via "Per anonymous IP rate limit exceeded"
 * blanking out playback after a handful of reloads. The proxy also fixes
 * Shelby serving every blob as `application/octet-stream` regardless of
 * content. See api/stream/index.ts for the actual proxying.
 *
 * v1 note: access control here is enforced at the app layer (the Player
 * route only renders once we've confirmed a real unlock-grant record for the
 * connected wallet) rather than at the Shelby storage layer itself — Shelby's
 * pay-per-read micropayment-channel mechanism isn't fully documented yet for
 * client-side streaming reads. TODO(v2): move gating to signed/session reads.
 */
export function getBlobUrl(manifestPath: string): string {
  return `${API_BASE_URL}/api/stream?path=${encodeURIComponent(manifestPath)}`;
}

/** Strips the `<account>/` prefix off a manifest path, giving the blob name
 * as the Shelby SDK's delete calls expect it (account-relative). */
export function blobNameFromManifestPath(manifestPath: string): string {
  return manifestPath.slice(manifestPath.indexOf("/") + 1);
}

/** Links to this blob's storage account on Shelby's own explorer, rather
 * than dumping the user on its homepage where they'd have to paste the
 * address in themselves — from there the account's Folder View lists every
 * blob it owns. The SDK also exposes getShelbyBlobExplorerUrl() for a
 * per-blob deep link, but that 404s against the live explorer (confirmed
 * live — nested-path blob names don't resolve the way the SDK encodes
 * them), so this sticks to the account-level link Shelby's own docs
 * describe as the supported way to browse a given account's blobs. */
export function getBlobExplorerUrl(manifestPath: string): string {
  const accountAddress = manifestPath.slice(0, manifestPath.indexOf("/"));
  return getShelbyAccountExplorerUrl(Network.SHELBYNET, accountAddress);
}

/** Inverse of getBlobUrl: recovers `<account>/<blobName>` from a blob URL,
 * or null if the URL isn't one of our own blob URLs (e.g. the Unsplash
 * stock fallback thumbnail some lectures still use). Accepts the current
 * `?path=` proxy form, the older `/api/stream/<path>` catch-all-route form,
 * and the original direct-Shelby-RPC form — lectures published under any
 * earlier version of this app still have whichever form was current then
 * stored as their thumbnailUrl. */
export function manifestPathFromBlobUrl(url: string): string | null {
  const queryPrefix = `${API_BASE_URL}/api/stream?path=`;
  if (url.startsWith(queryPrefix)) return decodeURIComponent(url.slice(queryPrefix.length));

  const pathPrefix = `${API_BASE_URL}/api/stream/`;
  if (url.startsWith(pathPrefix)) return url.slice(pathPrefix.length);

  const rpcEndpoint = import.meta.env.VITE_SHELBY_RPC_ENDPOINT?.replace(/\/$/, "");
  const directPrefix = rpcEndpoint ? `${rpcEndpoint}/v1/blobs/` : null;
  if (directPrefix && url.startsWith(directPrefix)) return url.slice(directPrefix.length);

  return null;
}
