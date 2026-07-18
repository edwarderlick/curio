import { MediaActionTypes, useMediaDispatch, useMediaSelector } from "media-chrome/react/media-store";

const SKIP_SECONDS = 10;

const BUTTON_CLASSES = "cursor-pointer p-3 rounded-full text-white hover:bg-white/10 transition-colors";

function useSkip(deltaSeconds: number) {
  const dispatch = useMediaDispatch();
  const currentTime = useMediaSelector((state) => state.mediaCurrentTime) ?? 0;
  const [min, max] = useMediaSelector((state) => state.mediaSeekable) ?? [0, Infinity];
  return () => {
    const target = Math.min(Math.max(currentTime + deltaSeconds, min), max);
    dispatch({ type: MediaActionTypes.MEDIA_SEEK_REQUEST, detail: target });
  };
}

export function SkipBackButton() {
  const skip = useSkip(-SKIP_SECONDS);
  return (
    <button type="button" className={BUTTON_CLASSES} onClick={skip} aria-label={`Rewind ${SKIP_SECONDS} seconds`}>
      <span className="material-symbols-outlined text-2xl">replay_10</span>
    </button>
  );
}

export function SkipForwardButton() {
  const skip = useSkip(SKIP_SECONDS);
  return (
    <button type="button" className={BUTTON_CLASSES} onClick={skip} aria-label={`Forward ${SKIP_SECONDS} seconds`}>
      <span className="material-symbols-outlined text-2xl">forward_10</span>
    </button>
  );
}
