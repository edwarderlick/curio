import { useEffect, useState } from "react";
import { useShaka } from "@shelby-protocol/player";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface WaterfallEvent {
  id: string;
  name: string;
  sizeBytes: number;
  timeMs: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Real segment fetch telemetry read straight off Shaka Player's
 * NetworkingEngine response filter — name/size/timing are exactly what the
 * player observed for each request, not simulated rows. Shelby's per-read
 * micropayment cost isn't exposed on this generic Response object, so we
 * show what's genuinely observable (name, size, fetch time) rather than
 * inventing a cost figure.
 */
export function NetworkWaterfall() {
  const shaka = useShaka();
  const [events, setEvents] = useState<WaterfallEvent[]>([]);

  useEffect(() => {
    if (!shaka) return;
    const networkingEngine = shaka.getNetworkingEngine();
    if (!networkingEngine) return;

    const filter = (
      _type: unknown,
      response: { uri: string; originalUri: string; data: ArrayBuffer | ArrayBufferView; timeMs?: number },
    ) => {
      const uri = response.uri ?? response.originalUri;
      const name = uri.split("/").pop() ?? uri;
      const sizeBytes = response.data.byteLength;
      setEvents((prev) => [{ id: `${Date.now()}-${name}-${Math.random()}`, name, sizeBytes, timeMs: response.timeMs ?? 0 }, ...prev].slice(0, 25));
    };

    networkingEngine.registerResponseFilter(filter);
    return () => networkingEngine.unregisterResponseFilter(filter);
  }, [shaka]);

  return (
    <GlassPanel className="p-6 space-y-3 flex flex-col">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Streaming Details</p>
      {events.length === 0 ? (
        <p className="text-on-surface-variant font-label-sm text-label-sm">Segment fetches will appear here once playback starts.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 text-label-sm font-label-sm border-b border-white/5 pb-2">
              <span className="text-white truncate" title={e.name}>
                {e.name}
              </span>
              <span className="text-secondary-fixed shrink-0">{formatBytes(e.sizeBytes)}</span>
              <span className="text-on-surface-variant shrink-0">{Math.round(e.timeMs)}ms</span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
