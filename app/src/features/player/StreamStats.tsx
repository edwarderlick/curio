import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface StreamStatsProps {
  src: string;
}

interface Sample {
  id: number;
  sizeBytes: number;
  timeMs: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Below this, an entry is almost certainly a cancelled/duplicate probe
 * request rather than a genuine sustained chunk transfer — the native
 * <video> element opens several overlapping Range requests and aborts most
 * of them right after one wins, and those show up as their own `resource`
 * entries with only a handful of bytes and a misleadingly long duration
 * (time until cancellation, not time to transfer anything meaningful).
 * Counting those as "speed" samples is what produced the 300B/0 KB/s noise
 * seen live — this floor filters them out. */
const MIN_SAMPLE_BYTES = 8 * 1024;

/**
 * Real network telemetry for the video's own range-request fetches, read
 * straight off the browser's Resource Timing API — not simulated. There's
 * no HLS segment list to hook into anymore (single-file direct-to-Shelby
 * playback, see ShelbyVideoPlayer), but the browser still issues separate
 * ranged HTTP requests against the same URL as it buffers ahead or seeks,
 * and each one shows up as its own `resource` timing entry we can read
 * size/latency off of.
 */
export function StreamStats({ src }: StreamStatsProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const seen = useRef(new Set<number>());
  const counter = useRef(0);

  useEffect(() => {
    setSamples([]);
    seen.current = new Set();
    counter.current = 0;
    const absoluteSrc = new URL(src, window.location.href).href;

    const consume = (entries: PerformanceResourceTiming[]) => {
      const next: Sample[] = [];
      for (const entry of entries) {
        if (entry.name !== absoluteSrc || seen.current.has(entry.startTime)) continue;
        seen.current.add(entry.startTime);
        const sizeBytes = entry.encodedBodySize || entry.transferSize;
        const timeMs = entry.responseEnd - entry.requestStart;
        if (sizeBytes < MIN_SAMPLE_BYTES || timeMs <= 0) continue;
        next.push({ id: counter.current++, sizeBytes, timeMs });
      }
      if (next.length) setSamples((prev) => [...next.reverse(), ...prev].slice(0, 20));
    };

    consume(performance.getEntriesByType("resource") as PerformanceResourceTiming[]);

    const observer = new PerformanceObserver((list) => consume(list.getEntries() as PerformanceResourceTiming[]));
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }, [src]);

  const latest = samples[0];
  const latestSpeedKBs = latest ? latest.sizeBytes / 1024 / (latest.timeMs / 1000) : null;

  return (
    <GlassPanel className="p-6 space-y-3 flex flex-col">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Streaming Details</p>
      {!latest ? (
        <p className="text-on-surface-variant font-label-sm text-label-sm">Fetch telemetry will appear here once playback starts.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm text-white">{latestSpeedKBs!.toFixed(0)}</span>
            <span className="text-on-surface-variant font-label-sm text-label-sm">KB/s</span>
            <span className="text-on-surface-variant font-label-sm text-label-sm ml-auto">{Math.round(latest.timeMs)}ms latency</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {samples.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-label-sm font-label-sm border-b border-white/5 pb-2">
                <span className="text-secondary-fixed shrink-0">{formatBytes(s.sizeBytes)}</span>
                <span className="text-on-surface-variant shrink-0">{Math.round(s.timeMs)}ms</span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassPanel>
  );
}
