interface ShelbyVideoPlayerProps {
  src: string;
  title: string;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
};

/** Shelby's RPC serves every blob as `application/octet-stream` (it's a
 * generic blob store, not a media host) — a bare `<video src>` relying on
 * that header won't play. An explicit `<source type>` tells the browser
 * what to expect regardless of the server header, so it decodes the real
 * bytes instead of refusing to try. */
function mimeTypeForUrl(url: string): string | undefined {
  const extension = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return extension ? MIME_BY_EXTENSION[extension] : undefined;
}

/**
 * Plain HTML5 <video>, playing the raw file directly from Shelby's RPC
 * (which serves blobs over plain HTTP + range requests, so this needs no
 * special client). No HLS/adaptive-bitrate ladder to switch between since
 * uploads are a single direct-to-Shelby blob write now — see
 * features/upload/steps/Step3Processing.tsx.
 */
export function ShelbyVideoPlayer({ src, title }: ShelbyVideoPlayerProps) {
  return (
    <div className="aspect-video rounded-3xl overflow-hidden glass-panel">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video controls playsInline title={title} className="w-full h-full bg-black">
        <source src={src} type={mimeTypeForUrl(src)} />
      </video>
    </div>
  );
}
