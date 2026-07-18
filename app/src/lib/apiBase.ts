/**
 * Base URL the backend (../server) lives at. Empty string (the default)
 * means same-origin relative paths — correct in dev (Vite proxies /api to
 * the local server) and in prod only if the frontend and backend are
 * actually served from the same origin. Set VITE_API_BASE_URL to the
 * backend's real URL when they're hosted separately, e.g. the app on
 * Vercel with the server on a host that can run ffmpeg/system binaries and
 * keep persistent local state (Railway, Render, Fly.io, a VPS — not
 * Vercel serverless, which this Express server isn't built for).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** Resolves a server-relative path (e.g. an /api/thumbnails/... URL
 * returned by the catalog) against API_BASE_URL. Leaves absolute URLs
 * (http(s)://…, like the Unsplash fallback thumbnail) untouched. */
export function resolveApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
}
