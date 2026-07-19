import { useParams, Navigate, Link } from "react-router-dom";
import { useLecture, useIsLectureUnlocked } from "@/lib/index/hooks";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { getBlobUrl } from "@/lib/shelby/blobUrl";
import { ShelbyVideoPlayer } from "@/features/player/ShelbyVideoPlayer";
import { StreamStats } from "@/features/player/StreamStats";

export function LecturePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useLecture(id);
  const { isUnlocked, isLoading: grantsLoading } = useIsLectureUnlocked(id);

  if (isLoading || grantsLoading) return <LoadingState title="Loading lecture" className="max-w-container-max-width mx-auto" />;

  if (isError || !data) {
    return error?.message === "NOT_FOUND" ? (
      <ErrorState title="Lecture not found" className="max-w-container-max-width mx-auto" />
    ) : (
      <ErrorState description="Couldn't reach the catalog index." className="max-w-container-max-width mx-auto" />
    );
  }

  if (!isUnlocked) return <Navigate to={`/lecture/${id}`} replace />;

  const { lecture } = data;
  const manifestUrl = getBlobUrl(lecture.manifestPath);

  return (
    <main className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 space-y-8">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <Link to={`/lecture/${lecture.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to details
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <ShelbyVideoPlayer src={manifestUrl} title={lecture.title} />
        </div>
        <StreamStats src={manifestUrl} />
      </div>

      <div>
        <h1 className="font-headline-lg text-headline-lg text-white">{lecture.title}</h1>
        <p className="text-on-surface-variant font-body-md">{lecture.moduleTitle}</p>
      </div>
    </main>
  );
}
