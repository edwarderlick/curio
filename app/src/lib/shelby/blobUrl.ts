import { API_BASE_URL } from "@/lib/apiBase";

/**
 * Proxied blob read URL — routes through app/api/stream/[...path].ts rather
 * than hitting Shelby's RPC directly from the browser. That's required, not
 * just nicer: the browser can't attach the Authorization header Shelby's
 * API-key auth needs on a plain <video>/<img> src (hard platform limit), so
 * unauthenticated direct reads hit Shelby's anonymous per-IP byte rate
 * limit fast — confirmed live via "Per anonymous IP rate limit exceeded"
 * blanking out playback after a handful of reloads. The proxy also fixes
 * Shelby serving every blob as `application/octet-stream` regardless of
 * content. See api/stream/[...path].ts for the actual proxying.
 *
 * v1 note: access control here is enforced at the app layer (the Player
 * route only renders once we've confirmed a real unlock-grant record for the
 * connected wallet) rather than at the Shelby storage layer itself — Shelby's
 * pay-per-read micropayment-channel mechanism isn't fully documented yet for
 * client-side streaming reads. TODO(v2): move gating to signed/session reads.
 */
export function getBlobUrl(manifestPath: string): string {
  return `${API_BASE_URL}/api/stream/${manifestPath}`;
}

/** Strips the `<account>/` prefix off a manifest path, giving the blob name
 * as the Shelby SDK's delete calls expect it (account-relative). */
export function blobNameFromManifestPath(manifestPath: string): string {
  return manifestPath.slice(manifestPath.indexOf("/") + 1);
}

/** Inverse of getBlobUrl: recovers `<account>/<blobName>` from a blob URL,
 * or null if the URL isn't one of our own blob URLs (e.g. the Unsplash
 * stock fallback thumbnail some lectures still use). Accepts both the
 * current proxy URL form and the older direct-Shelby-RPC form (lectures
 * published before the proxy existed still have that stored as their
 * thumbnailUrl). */
export function manifestPathFromBlobUrl(url: string): string | null {
  const proxyPrefix = `${API_BASE_URL}/api/stream/`;
  if (url.startsWith(proxyPrefix)) return url.slice(proxyPrefix.length);

  const rpcEndpoint = import.meta.env.VITE_SHELBY_RPC_ENDPOINT?.replace(/\/$/, "");
  const directPrefix = rpcEndpoint ? `${rpcEndpoint}/v1/blobs/` : null;
  if (directPrefix && url.startsWith(directPrefix)) return url.slice(directPrefix.length);

  return null;
}
