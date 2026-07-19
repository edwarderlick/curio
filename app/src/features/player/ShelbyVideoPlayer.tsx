interface ShelbyVideoPlayerProps {
  src: string;
  title: string;
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
      <video src={src} controls playsInline title={title} className="w-full h-full bg-black" />
    </div>
  );
}
