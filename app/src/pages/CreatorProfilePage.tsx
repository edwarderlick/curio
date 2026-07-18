import { useParams } from "react-router-dom";
import { useCreatorProfile } from "@/lib/index/hooks";
import { LectureCard } from "@/components/ui/LectureCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Avatar } from "@/components/ui/Avatar";
import type { ChainId } from "@/types";

const CHAIN_META: Record<ChainId, { label: string; icon: string; tone: string }> = {
  aptos: { label: "Aptos", icon: "token", tone: "text-secondary-fixed" },
  ethereum: { label: "Ethereum", icon: "hexagon", tone: "text-tertiary" },
  solana: { label: "Solana", icon: "bolt", tone: "text-tertiary" },
};

export function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useCreatorProfile(id);

  if (isLoading) return <LoadingState title="Loading creator" className="max-w-container-max-width mx-auto" />;
  if (isError || !data) {
    return error?.message === "NOT_FOUND" ? (
      <ErrorState title="Creator not found" className="max-w-container-max-width mx-auto" />
    ) : (
      <ErrorState description="Couldn't reach the catalog index." className="max-w-container-max-width mx-auto" />
    );
  }

  const { creator, lectures } = data;
  const connectedChains = (Object.keys(CHAIN_META) as ChainId[]).filter((c) => creator.payoutAddress[c]);

  return (
    <main className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-10">
      <GlassPanel className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <Avatar src={creator.avatarUrl} alt={creator.name} size={96} ring />
        <div className="flex-1 text-center md:text-left">
          <h1 className="font-headline-lg text-headline-lg text-white">{creator.name}</h1>
          <p className="text-primary font-label-sm text-label-sm mb-2">{creator.handle}</p>
          <p className="text-on-surface-variant font-body-md mb-4">{creator.title}</p>
          {creator.bio && <p className="text-on-surface-variant font-body-md max-w-2xl">{creator.bio}</p>}
          {connectedChains.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {connectedChains.map((c) => (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 font-label-sm text-label-sm ${CHAIN_META[c].tone}`}
                >
                  <span className="material-symbols-outlined text-sm">{CHAIN_META[c].icon}</span>
                  {CHAIN_META[c].label}
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      <section className="space-y-6">
        <h2 className="font-headline-md text-headline-md text-white">Lectures</h2>
        {lectures.length === 0 ? (
          <EmptyState icon="school" title="No lectures published yet" description="This creator hasn't published anything yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {lectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
