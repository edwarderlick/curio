import { MediaProvider } from "media-chrome/react/media-store";
import { PlayerProvider, PlayerContainer, ShakaVideo } from "@shelby-protocol/player";
import { NetworkWaterfall } from "./NetworkWaterfall";
import { CustomControls } from "./CustomControls";

interface ShelbyVideoPlayerProps {
  src: string;
  title: string;
}

/**
 * Composes the player manually (rather than the all-in-one <VideoPlayer>)
 * so a sibling component can reach the real Shaka Player instance via
 * useShaka() inside the same PlayerProvider and observe real network
 * activity for the Streaming Details panel.
 */
export function ShelbyVideoPlayer({ src, title }: ShelbyVideoPlayerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
      <MediaProvider>
        <PlayerProvider>
          <div className="lg:col-span-2 aspect-video rounded-3xl overflow-hidden glass-panel">
            <PlayerContainer className="w-full h-full">
              <ShakaVideo src={src} className="absolute inset-0 w-full h-full" />
              <CustomControls title={title} />
            </PlayerContainer>
          </div>
          <NetworkWaterfall />
        </PlayerProvider>
      </MediaProvider>
    </div>
  );
}
