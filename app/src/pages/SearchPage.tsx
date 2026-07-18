import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ChainId } from "@/types";
import { useLectures } from "@/lib/index/hooks";
import { LectureCard } from "@/components/ui/LectureCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

const CHAINS: { id: ChainId; label: string }[] = [
  { id: "aptos", label: "Aptos" },
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
];

const DURATIONS = [
  { label: "Any length", test: () => true },
  { label: "Under 2 hours", test: (s: number) => s < 2 * 3600 },
  { label: "2 - 5 hours", test: (s: number) => s >= 2 * 3600 && s <= 5 * 3600 },
  { label: "5+ hours", test: (s: number) => s > 5 * 3600 },
];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [chains, setChains] = useState<Set<ChainId>>(new Set());
  const [maxPrice, setMaxPrice] = useState(500);
  const [durationIdx, setDurationIdx] = useState(0);

  const { data, isLoading, isError, refetch } = useLectures({ q: q || undefined });

  const filtered = useMemo(() => {
    let lectures = data?.lectures ?? [];
    if (chains.size > 0) lectures = lectures.filter((l) => chains.has(l.chain));
    lectures = lectures.filter((l) => l.price.usd <= maxPrice);
    lectures = lectures.filter((l) => DURATIONS[durationIdx].test(l.durationSeconds));
    return lectures;
  }, [data, chains, maxPrice, durationIdx]);

  function toggleChain(chain: ChainId) {
    setChains((prev) => {
      const next = new Set(prev);
      next.has(chain) ? next.delete(chain) : next.add(chain);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 shrink-0 border-r border-white/5 bg-surface-container-low/80 px-8 py-8 hidden xl:block">
        <div className="space-y-10">
          <section>
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Network</h3>
            <div className="flex flex-wrap gap-2">
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleChain(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm border transition-all ${
                    chains.has(c.id) ? "bg-primary-container/20 border-primary-container/40 text-primary" : "bg-surface-variant border-white/5 text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Price Range (USD)</h3>
            <div className="space-y-4">
              <input
                type="range"
                min={0}
                max={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary-container"
              />
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>$0</span>
                <span>{maxPrice >= 500 ? "$500+" : `$${maxPrice}`}</span>
              </div>
            </div>
          </section>
          <section>
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Duration</h3>
            <select
              value={durationIdx}
              onChange={(e) => setDurationIdx(Number(e.target.value))}
              className="w-full bg-surface-container-high border-white/5 rounded-xl font-body-md text-body-md py-3 px-4 focus:ring-primary-container focus:border-primary-container"
            >
              {DURATIONS.map((d, i) => (
                <option key={d.label} value={i}>
                  {d.label}
                </option>
              ))}
            </select>
          </section>
        </div>
      </aside>

      <main className="flex-grow px-margin-mobile md:px-12 py-8 max-w-[1440px]">
        <div className="mb-8">
          <div className="relative max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              value={q}
              onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})}
              className="w-full bg-surface-container-high/50 border border-white/5 rounded-full py-2.5 pl-12 pr-4 font-body-md text-body-md focus:outline-none focus:border-primary-container transition-all"
              placeholder="Search courses, creators, or topics..."
            />
          </div>
        </div>

        {isLoading && <LoadingState title="Searching" />}
        {isError && <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} />}
        {!isLoading && !isError && (
          <>
            <p className="text-on-surface-variant font-label-sm text-label-sm mb-6">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
            {filtered.length === 0 ? (
              <EmptyState icon="search_off" title="No matches" description="Try a broader search term or clear some filters." />
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {filtered.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
