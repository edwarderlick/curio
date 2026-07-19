import type { VercelRequest, VercelResponse } from "@vercel/node";

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Proxies reads of Shelby blobs (video sources, thumbnails) through a
 * single server-held API key instead of every viewer's browser hitting
 * Shelby's RPC anonymously. Two real constraints force this to be a
 * server-side proxy rather than the browser fetching Shelby directly:
 *
 * - The Shelby SDK authenticates with `Authorization: Bearer <key>`, but a
 *   plain <video>/<img> src can't attach custom headers at all — that's a
 *   hard browser platform limit, not a config gap. Authenticating those
 *   reads is only possible server-side.
 * - Without a key, Shelby rate-limits by IP on total response bytes; a
 *   handful of page reloads during testing was enough to hit
 *   "Per anonymous IP rate limit exceeded" and blank out playback for
 *   everyone sharing that IP/NAT.
 *
 * Also fixes Shelby serving every blob as `application/octet-stream`
 * regardless of content — this sets a real type from the file extension.
 * Streams the response through (forwarding Range/Content-Range) rather
 * than buffering it, so seeking still works and large files don't need to
 * fully load into this function's memory.
 *
 * Takes the blob path as a `?path=` query param rather than a `[...path]`
 * catch-all URL segment — confirmed live that this deployment's catch-all
 * dynamic routes 404 at the platform level (X-Vercel-Error: NOT_FOUND)
 * even though single-segment `[id]` routes resolve fine, so this sticks to
 * the plain-static-route pattern that's already proven to work here.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawPath = req.query.path;
  const blobPath = Array.isArray(rawPath) ? rawPath[0] : rawPath;
  if (!blobPath) return res.status(400).json({ error: "Missing path query parameter" });

  const rpcEndpoint = (process.env.SHELBY_RPC_ENDPOINT || "https://api.shelbynet.shelby.xyz/shelby").replace(/\/$/, "");
  const upstreamHeaders: Record<string, string> = {};
  if (req.headers.range) upstreamHeaders.Range = req.headers.range as string;
  if (process.env.SHELBY_API_KEY) upstreamHeaders.Authorization = `Bearer ${process.env.SHELBY_API_KEY}`;

  const upstream = await fetch(`${rpcEndpoint}/v1/blobs/${blobPath}`, { headers: upstreamHeaders });
  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: `Upstream fetch failed: ${upstream.status}` });
  }

  const extension = blobPath.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  const contentType = (extension && MIME_BY_EXTENSION[extension]) || upstream.headers.get("content-type") || "application/octet-stream";

  res.status(upstream.status);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) res.setHeader("Content-Range", contentRange);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) res.setHeader("Content-Length", contentLength);
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (!upstream.body) return res.end();
  const reader = upstream.body.getReader();
  req.on("close", () => {
    reader.cancel().catch(() => {});
  });
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}
