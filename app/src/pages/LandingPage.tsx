import { Link } from "react-router-dom";
import { useLectures } from "@/lib/index/hooks";
import { LectureCard } from "@/components/ui/LectureCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { GlassPanel } from "@/components/ui/GlassPanel";

const HOW_IT_WORKS = [
  { step: "STEP 01", title: "Connect Wallet", icon: "account_balance_wallet", tone: "text-primary bg-primary/10", desc: "Seamlessly link your Aptos, Ethereum, or Solana wallet to start your learning journey." },
  { step: "STEP 02", title: "Pick a Lecture", icon: "search", tone: "text-secondary-fixed bg-secondary-container/10", desc: "Browse micro-lectures from creators across web3, AI, and design." },
  { step: "STEP 03", title: "Unlock", icon: "lock_open", tone: "text-tertiary bg-tertiary/10", desc: "Pay only for what you learn. Instant micro-payments secure your permanent access." },
  { step: "STEP 04", title: "Stream Instantly", icon: "play_circle", tone: "text-primary-container bg-primary-container/10", desc: "High-fidelity, low-latency streaming built for the modern learner." },
];

export function LandingPage() {
  const { data, isLoading, isError, refetch } = useLectures();
  const featured = data?.lectures.slice(0, 6) ?? [];
  const featuredCreators = data?.creators.slice(0, 4) ?? [];

  return (
    <main className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[600px]">
        <div className="lg:col-span-7 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/10 border border-secondary-container/20 text-secondary-fixed mb-6">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span className="font-label-sm">DECENTRALIZED STREAMING</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-white mb-6 leading-tight">
            Master the Future of <span className="text-primary text-glow">Skill Mastery</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Learn from creators on a decentralized platform. Pay per lecture. Your content lives on Shelby, secured on-chain.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/explore" className="bg-primary-container text-on-primary-container font-bold px-8 py-4 rounded-xl flex items-center gap-3 group transition-all hover:pr-10">
              Explore Lectures
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link to="/studio" className="border border-outline px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition-colors">
              Start Creating
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5 relative h-full min-h-[300px] flex items-center justify-center">
          <GlassPanel className="relative z-10 rounded-3xl p-8 w-full max-w-md transform hover:rotate-2 transition-transform duration-500 shadow-2xl">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-container/30 to-tertiary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-8xl text-primary/60">bolt</span>
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <p className="font-label-sm text-primary mb-1">SHELBYNET</p>
                <h3 className="font-headline-md text-headline-md text-white">Live Storage Network</h3>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline-lg text-headline-lg text-white mb-4">How it works</h2>
          <div className="w-20 h-1 bg-primary-container mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((s) => (
            <GlassPanel key={s.title} hoverGlow className="p-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${s.tone}`}>
                <span className="material-symbols-outlined text-3xl">{s.icon}</span>
              </div>
              <span className="font-label-sm text-primary mb-2 block">{s.step}</span>
              <h3 className="font-headline-md text-headline-md text-white mb-4">{s.title}</h3>
              <p className="font-body-md text-on-surface-variant">{s.desc}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Featured Lectures */}
      <section className="py-20 bg-surface-container-low/40">
        <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-10 flex justify-between items-end">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-white mb-2">Featured Lectures</h2>
            <p className="font-body-md text-on-surface-variant">Trending topics across the decentralized ecosystem.</p>
          </div>
        </div>
        <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          {isLoading && <LoadingState title="Loading featured lectures" />}
          {isError && <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} />}
          {!isLoading && !isError && featured.length === 0 && (
            <EmptyState
              icon="school"
              title="No lectures published yet"
              description="Curio is live on Shelbynet with zero lectures so far — be the first creator to publish one."
              action={
                <Link to="/studio/upload" className="bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl">
                  Upload a lecture
                </Link>
              }
            />
          )}
          {!isLoading && !isError && featured.length > 0 && (
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
              {featured.map((lecture) => (
                <div key={lecture.id} className="min-w-[340px]">
                  <LectureCard lecture={lecture} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:w-1/3">
            <h2 className="font-headline-lg text-headline-lg text-white mb-6">Learn from the Vanguard</h2>
            <p className="font-body-lg text-on-surface-variant mb-8">We partner with creators actively building the decentralized web.</p>
            <Link to="/studio" className="flex items-center gap-2 text-primary font-bold hover:underline w-fit">
              Apply to be a creator
              <span className="material-symbols-outlined">arrow_outward</span>
            </Link>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featuredCreators.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState icon="groups" title="No creators yet" description="Creator profiles appear here once someone publishes their first lecture." />
              </div>
            ) : (
              featuredCreators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/creator/${creator.id}`}
                  className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform"
                >
                  <img className="w-20 h-20 rounded-xl object-cover" src={creator.avatarUrl} alt={creator.name} />
                  <div>
                    <h5 className="font-headline-md text-body-lg text-white">{creator.name}</h5>
                    <p className="text-label-sm text-on-surface-variant mb-2">{creator.title}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <GlassPanel className="p-12 md:p-20 rounded-[40px] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48" />
          <div className="relative z-10">
            <h2 className="font-display-lg text-display-lg text-white mb-6">Ready to own your knowledge?</h2>
            <p className="font-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
              Join a community of curious minds and builders. Your first lecture is waiting on Shelbynet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/explore" className="bg-primary-container text-on-primary-container font-bold px-10 py-4 rounded-xl text-lg hover:scale-105 transition-transform">
                Get Started Today
              </Link>
            </div>
          </div>
        </GlassPanel>
      </section>
    </main>
  );
}
