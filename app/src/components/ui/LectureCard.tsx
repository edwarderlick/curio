import { Link } from "react-router-dom";
import type { LectureSummary } from "@/types";
import { Chip } from "./Chip";
import { Avatar } from "./Avatar";
import { useChainPrice } from "@/lib/chains/pricing";

interface LectureCardProps {
  lecture: LectureSummary;
  locked?: boolean;
}

/** The single lecture/course card used on Explore, Search, Creator Profile
 * and Related-content sections — built once per Step 4. */
export function LectureCard({ lecture, locked = true }: LectureCardProps) {
  const priceLabel = useChainPrice(lecture.price, lecture.chain);

  return (
    <Link
      to={`/lecture/${lecture.id}`}
      className="glass-panel rounded-[2rem] overflow-hidden flex flex-col group cursor-pointer transition-all duration-500 hover:-translate-y-2"
    >
      <div className="relative aspect-video">
        <img
          src={lecture.thumbnailUrl}
          alt={lecture.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {locked && (
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 group-hover:bg-primary-container group-hover:border-primary transition-all duration-300">
            <span className="material-symbols-outlined text-white text-[20px]">lock</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white font-label-sm text-label-sm border border-white/10">
            {lecture.durationLabel}
          </span>
        </div>
        {lecture.trending && (
          <div className="absolute top-4 left-4 bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[10px] font-bold">
            TRENDING
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <Chip tone={lecture.categoryTone}>{lecture.category}</Chip>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {lecture.title}
        </h3>
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={lecture.creator.avatarUrl} alt={lecture.creator.name} size={40} />
            <div className="min-w-0">
              <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{lecture.creator.name}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{lecture.creator.title}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-headline-md text-headline-md text-primary-container font-bold">{priceLabel.native}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{priceLabel.usd}</p>
          </div>
        </div>
      </div>
      {typeof lecture.progressPct === "number" && (
        <div className="h-1 bg-surface-container-high w-full">
          <div className="h-full bg-primary-container transition-all" style={{ width: `${lecture.progressPct}%` }} />
        </div>
      )}
    </Link>
  );
}
