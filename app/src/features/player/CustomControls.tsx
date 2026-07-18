import { useMediaSelector } from "media-chrome/react/media-store";
import {
  Controls,
  ControlsBackdrop,
  ControlsGroup,
  CurrentTimeDisplay,
  DropdownMenu,
  DropdownMenuContent,
  FullscreenButton,
  MediaTitle,
  MuteButton,
  PipButton,
  PlaybackRateSubMenu,
  PlayButton,
  PlayGestureRegion,
  RenditionsSubMenuButton,
  Seekbar,
  SettingsMenuTriggerButton,
  useFullscreenContainer,
  VolumeSlider,
} from "@shelby-protocol/player";
import { SkipBackButton, SkipForwardButton } from "./SkipButtons";

interface CustomControlsProps {
  title?: string;
}

/**
 * Same layout as the package's <DefaultControls>, plus rewind/forward-10
 * buttons — the player library doesn't expose a way to slot extra buttons
 * into DefaultControls, so this recomposes it from the same exported parts.
 */
export function CustomControls({ title }: CustomControlsProps) {
  const fullscreenContainer = useFullscreenContainer();
  const mediaIsFullscreen = useMediaSelector((state) => state.mediaIsFullscreen);

  return (
    <Controls>
      <div className="flex-1 relative">
        <PlayGestureRegion className="absolute left-0 top-0 bottom-0 right-0" />
      </div>
      <ControlsBackdrop />
      <ControlsGroup className="px-4">
        <Seekbar />
      </ControlsGroup>
      <ControlsGroup className="pb-1 px-2">
        <SkipBackButton />
        <PlayButton />
        <SkipForwardButton />
        <MuteButton />
        <VolumeSlider />
        <MediaTitle title={title} />
        <div className="flex-1" />
        <CurrentTimeDisplay />
        <PipButton />
        <DropdownMenu>
          <SettingsMenuTriggerButton />
          <DropdownMenuContent
            className="sp-default-layout-dropdown-menu-content bg-sp-popover text-sp-popover-foreground shadow-sm p-2 min-w-64 z-50"
            side="top"
            align="end"
            container={mediaIsFullscreen ? fullscreenContainer?.current : undefined}
          >
            <RenditionsSubMenuButton />
            <PlaybackRateSubMenu />
          </DropdownMenuContent>
        </DropdownMenu>
        <FullscreenButton />
      </ControlsGroup>
    </Controls>
  );
}
