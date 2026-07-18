import { Link } from "react-router-dom";
import { useConnectedAddress } from "@/features/wallet/store";
import { useLectures, useUnlockGrants } from "@/lib/index/hooks";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";

const DAY_MICROS = 86_400 * 1_000_000;

export function StudioDashboardPage() {
  const address = useConnectedAddress();
  const { data: lecturesData, isLoading: lecturesLoading, isError } = useLectures(address ? { creatorId: address } : {});
  const { data: grants, isLoading: grantsLoading } = useUnlockGrants({ creatorId: address ?? undefined });

  if (!address) {
    return (
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <EmptyState icon="account_balance_wallet" title="Connect a wallet" description="Creator Studio uses your connected wallet address as your creator identity." />
      </div>
    );
  }

  if (lecturesLoading || grantsLoading) return <LoadingState title="Loading your studio" className="max-w-container-max-width mx-auto" />;
  if (isError) return <ErrorState description="Couldn't reach the catalog index." className="max-w-container-max-width mx-auto" />;

  const lectures = lecturesData?.lectures ?? [];
  const myGrants = grants ?? [];
  const totalEarningsUsd = myGrants.reduce((sum, g) => sum + g.amount, 0);
  const uniqueLearners = new Set(myGrants.map((g) => g.walletAddress)).size;
  const now = Date.now() * 1000;
  const expiringSoon = lectures.filter((l) => l.expirationMicros - now < 14 * DAY_MICROS);

  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-white mb-2">Creator Studio</h1>
          <p className="text-on-surface-variant font-body-md">Real numbers from your published lectures and recorded unlocks.</p>
        </div>
        <Link to="/studio/upload">
          <Button icon={<span className="material-symbols-outlined">add</span>} iconPosition="left">
            Upload Lecture
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <GlassPanel className="p-6">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Published Lectures</p>
          <p className="font-display-lg text-display-lg text-white">{lectures.length}</p>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Total Earnings</p>
          <p className="font-display-lg text-display-lg text-primary">${totalEarningsUsd.toFixed(2)}</p>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Unique Learners</p>
          <p className="font-display-lg text-display-lg text-white">{uniqueLearners}</p>
        </GlassPanel>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-white">Your Lectures</h2>
          <Link to="/studio/content" className="text-primary font-label-sm text-label-sm hover:underline">
            Manage all
          </Link>
        </div>
        {lectures.length === 0 ? (
          <EmptyState icon="school" title="Nothing published yet" description="Upload your first lecture to see real dashboard numbers here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {lectures.slice(0, 4).map((lecture) => (
              <GlassPanel key={lecture.id} className="p-4 flex items-center gap-4">
                <img src={lecture.thumbnailUrl} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold truncate">{lecture.title}</p>
                  <p className="text-on-surface-variant font-label-sm text-label-sm">${lecture.price.usd.toFixed(2)} USD</p>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </section>

      {expiringSoon.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-headline-md text-headline-md text-white">Content Expiring Soon</h2>
          <GlassPanel className="p-6 space-y-3 border-error-container/30">
            {expiringSoon.map((lecture) => {
              const daysLeft = Math.max(0, Math.round((lecture.expirationMicros - now) / DAY_MICROS));
              return (
                <div key={lecture.id} className="flex items-center justify-between">
                  <span className="text-white font-body-md truncate">{lecture.title}</span>
                  <span className="text-error font-label-sm text-label-sm shrink-0 ml-4">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
                </div>
              );
            })}
            <Link to="/studio/content" className="block text-primary font-label-sm text-label-sm hover:underline pt-2">
              Renew in Content Management →
            </Link>
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
