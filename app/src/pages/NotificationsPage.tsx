import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useConnectedAddress } from "@/features/wallet/store";
import { useLectures, useUnlockGrants } from "@/lib/index/hooks";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

export function NotificationsPage() {
  const address = useConnectedAddress();
  const { data: myUnlocks, isLoading: myUnlocksLoading } = useUnlockGrants({ walletAddress: address ?? undefined });
  const { data: myLectures, isLoading: lecturesLoading } = useLectures(address ? { creatorId: address } : {});
  const { data: salesOfMine, isLoading: salesLoading, isError, refetch } = useUnlockGrants({ creatorId: address ?? undefined });

  const lectureTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of myLectures?.lectures ?? []) map.set(l.id, l.title);
    return map;
  }, [myLectures]);

  if (!address) {
    return (
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <EmptyState icon="account_balance_wallet" title="Connect a wallet" description="Activity is scoped to your connected wallet." />
      </div>
    );
  }

  if (myUnlocksLoading || lecturesLoading || salesLoading) return <LoadingState title="Loading activity" className="max-w-container-max-width mx-auto" />;
  if (isError) return <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} className="max-w-container-max-width mx-auto" />;

  type Activity = { key: string; icon: string; tone: string; text: string; when: string; href?: string };
  const activity: Activity[] = [
    ...(myUnlocks ?? []).map((g) => ({
      key: `unlock-${g.txHash}`,
      icon: "lock_open",
      tone: "text-primary",
      text: `You unlocked "${lectureTitles.get(g.lectureId) ?? g.lectureId}" for $${g.amount.toFixed(2)}`,
      when: g.unlockedAt,
      href: `/lecture/${g.lectureId}`,
    })),
    ...(salesOfMine ?? [])
      .filter((g) => g.walletAddress.toLowerCase() !== address.toLowerCase())
      .map((g) => ({
        key: `sale-${g.txHash}`,
        icon: "payments",
        tone: "text-secondary-fixed",
        text: `Someone unlocked "${lectureTitles.get(g.lectureId) ?? g.lectureId}" — you earned $${g.amount.toFixed(2)}`,
        when: g.unlockedAt,
        href: `/lecture/${g.lectureId}`,
      })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-6">
      <h1 className="font-headline-lg text-headline-lg text-white">Notifications / Activity</h1>

      {activity.length === 0 ? (
        <EmptyState icon="notifications" title="No activity yet" description="Unlocks you make and sales on your lectures will show up here." />
      ) : (
        <GlassPanel className="divide-y divide-white/5">
          {activity.map((item) => (
            <Link key={item.key} to={item.href ?? "#"} className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors">
              <span className={`material-symbols-outlined text-2xl ${item.tone}`}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-body-md">{item.text}</p>
                <p className="text-on-surface-variant font-label-sm text-label-sm">{new Date(item.when).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
