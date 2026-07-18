import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLecture, useIsLectureUnlocked } from "@/lib/index/hooks";
import { useConnectedAddress, useWalletStore } from "@/features/wallet/store";
import { useChainPrice } from "@/lib/chains/pricing";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CheckoutModal } from "@/features/payments/CheckoutModal";

const TABS = ["Description", "Curriculum", "Reviews"] as const;

export function LectureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useLecture(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const openConnectModal = useWalletStore((s) => s.openConnectModal);
  const connectedAddress = useConnectedAddress() ?? undefined;

  const { isUnlocked } = useIsLectureUnlocked(id);

  const priceLabel = useChainPrice(data?.lecture.price ?? { usd: 0 }, data?.lecture.chain ?? "aptos");

  if (isLoading) return <LoadingState title="Loading lecture" className="max-w-container-max-width mx-auto" />;
  if (isError || !data) {
    return error?.message === "NOT_FOUND" ? (
      <ErrorState title="Lecture not found" description="This lecture doesn't exist in the catalog." className="max-w-container-max-width mx-auto" />
    ) : (
      <ErrorState description="Couldn't reach the catalog index." className="max-w-container-max-width mx-auto" />
    );
  }

  const { lecture } = data;

  return (
    <main className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 grid grid-cols-1 lg:grid-cols-12 gap-gutter relative">
      <div className="lg:col-span-8 space-y-8">
        <section className="relative aspect-video rounded-3xl overflow-hidden group">
          {!isUnlocked ? (
            <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
                <span className="material-symbols-outlined text-5xl text-primary">lock</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-white mb-4">{lecture.title}</h2>
              <p className="text-on-surface-variant max-w-md mb-8">This premium micro-lecture is secured on Shelbynet. Unlock the full curriculum to start learning.</p>
              <Button
                size="lg"
                icon={<span className="material-symbols-outlined">payments</span>}
                onClick={() => (connectedAddress ? setCheckoutOpen(true) : openConnectModal())}
              >
                Unlock to Watch
              </Button>
            </div>
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 bg-black/40">
              <span className="material-symbols-outlined text-5xl text-secondary-fixed mb-4">lock_open</span>
              <p className="text-white font-bold mb-6">Unlocked — ready to stream</p>
              <Button size="lg" icon={<span className="material-symbols-outlined">play_arrow</span>} iconPosition="left" onClick={() => navigate(`/lecture/${lecture.id}/watch`)}>
                Watch Now
              </Button>
            </div>
          )}
          <img src={lecture.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover grayscale blur-sm opacity-40" />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {lecture.tags.map((tag) => (
              <Chip key={tag} tone="secondary" className="rounded-full">
                {tag}
              </Chip>
            ))}
          </div>
          <h1 className="font-headline-lg text-headline-lg text-white">{lecture.moduleTitle}</h1>
          <div className="flex items-center justify-between py-4 border-y border-white/5">
            <div className="flex items-center gap-4">
              <Avatar src={lecture.creator.avatarUrl} alt={lecture.creator.name} size={48} ring />
              <div>
                <p className="font-bold text-white leading-tight">{lecture.creator.name}</p>
                <p className="text-label-sm font-label-sm text-primary">{lecture.creator.title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-label-sm font-label-sm text-on-surface-variant">PUBLISHED</p>
              <p className="font-body-md text-body-md text-white">{new Date(lecture.publishedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex gap-8 border-b border-white/5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-4 transition-colors ${t === tab ? "font-bold text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Description" && (
            <GlassPanel className="p-8 space-y-4">
              <p className="text-on-surface-variant leading-relaxed">{lecture.description}</p>
              <ul className="space-y-3">
                {lecture.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                    <span className="text-on-surface">{o}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
          {tab === "Curriculum" && <GlassPanel className="p-8 text-on-surface-variant">Curriculum breakdown coming soon.</GlassPanel>}
          {tab === "Reviews" && <GlassPanel className="p-8 text-on-surface-variant">No reviews yet.</GlassPanel>}

          <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-secondary-container/10 rounded-xl flex items-center justify-center text-secondary-fixed shrink-0">
                <span className="material-symbols-outlined">database</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-body-md">On-Chain Asset</p>
                <p className="text-label-sm font-label-sm text-on-surface-variant break-all">{lecture.manifestPath}</p>
              </div>
            </div>
            <a
              className="flex items-center gap-1 text-primary font-bold hover:underline shrink-0"
              href="https://explorer.shelby.xyz/shelbynet"
              target="_blank"
              rel="noreferrer"
            >
              View on Explorer
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        </section>
      </div>

      <aside className="lg:col-span-4 h-fit sticky top-24">
        <GlassPanel className="p-8 rounded-[2rem] shadow-2xl space-y-8">
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant mb-1">COURSE ACCESS</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-white tracking-tighter">{priceLabel.native}</span>
            </div>
            <p className="text-on-surface-variant text-label-sm font-label-sm mt-2">{priceLabel.usd}</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full" size="lg" icon={<span className="material-symbols-outlined">wallet</span>} onClick={() => (connectedAddress ? setCheckoutOpen(true) : openConnectModal())}>
              {isUnlocked ? "Already Unlocked" : "Buy with Wallet"}
            </Button>
          </div>
          <div className="space-y-4 pt-6 border-t border-white/5">
            <p className="text-label-sm font-label-sm text-on-surface-variant">WHAT'S INCLUDED</p>
            <div className="space-y-3">
              {lecture.includes.map((item) => (
                <div key={item} className="flex items-center gap-3 text-body-md">
                  <span className="material-symbols-outlined text-on-surface-variant">check</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      </aside>

      <CheckoutModal lecture={lecture} creator={data.creator} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </main>
  );
}
