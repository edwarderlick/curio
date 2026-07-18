import { useState } from "react";
import type { ChainId } from "@/types";
import { useLectures } from "@/lib/index/hooks";
import { LectureCard } from "@/components/ui/LectureCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

const CHAINS: { id: ChainId; label: string }[] = [
  { id: "aptos", label: "Aptos" },
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
];

export function ExplorePage() {
  const [search, setSearch] = useState("");
  const [chain, setChain] = useState<ChainId | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useLectures({ q: search || undefined, chain });
  const lectures = data?.lectures ?? [];

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 shrink-0 border-r border-white/5 bg-surface-container-low/80 px-8 py-8 hidden xl:block">
        <div className="space-y-10">
          <section>
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Network</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChain(undefined)}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm border transition-all ${
                  !chain ? "bg-primary-container/20 border-primary-container/40 text-primary" : "bg-surface-variant border-white/5 text-on-surface-variant hover:border-primary/30"
                }`}
              >
                All
              </button>
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm border transition-all ${
                    chain === c.id ? "bg-primary-container/20 border-primary-container/40 text-primary" : "bg-surface-variant border-white/5 text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <main className="flex-grow px-margin-mobile md:px-12 py-8 max-w-[1440px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h1 className="font-headline-lg text-headline-lg text-white">Explore</h1>
          <div className="relative w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-high/50 border border-white/5 rounded-full py-2.5 pl-12 pr-4 font-body-md text-body-md focus:outline-none focus:border-primary-container transition-all"
              placeholder="Search courses, creators, or topics..."
            />
          </div>
        </div>

        {isLoading && <LoadingState title="Loading lectures" />}
        {isError && <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} />}
        {!isLoading && !isError && lectures.length === 0 && (
          <EmptyState
            icon="explore_off"
            title={search || chain ? "No lectures match your filters" : "No lectures published yet"}
            description={search || chain ? "Try a different search term or clear your filters." : "Once creators publish real Shelbynet content, it shows up here."}
          />
        )}
        {!isLoading && !isError && lectures.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {lectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
