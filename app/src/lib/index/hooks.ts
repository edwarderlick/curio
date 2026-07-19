import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChainId } from "@/types";
import { useConnectedAddress, useWalletStore } from "@/features/wallet/store";
import { fetchCreator, fetchLecture, fetchLectures, fetchUnlockGrants, saveCreator } from "./catalogClient";

export function useLectures(params: { q?: string; category?: string; chain?: ChainId; creatorId?: string } = {}) {
  return useQuery({
    queryKey: ["lectures", params],
    queryFn: () => fetchLectures(params),
  });
}

export function useLecture(id: string | undefined) {
  return useQuery({
    queryKey: ["lecture", id],
    queryFn: () => fetchLecture(id as string),
    enabled: Boolean(id),
    retry: (failureCount, error) => error.message !== "NOT_FOUND" && failureCount < 2,
  });
}

export function useCreatorProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["creator", id],
    queryFn: () => fetchCreator(id as string),
    enabled: Boolean(id),
    retry: (failureCount, error) => error.message !== "NOT_FOUND" && failureCount < 2,
  });
}

/**
 * Payout addresses are only recorded for whichever chains were connected at
 * publish time (see Step5Review) — a creator who connects more chains
 * afterward would otherwise stay stuck unable to get paid on them for
 * lectures already published. Mounted once app-wide (AppShell) so it fires
 * in the background as soon as a published creator has a wallet connected
 * that isn't in their payout record yet, no manual action required.
 *
 * Safe to run automatically: the server-side upsert only ever fills in
 * chains that were still null and refuses to change an already-set payout
 * address (api/_lib/db.ts), so this can't silently redirect anyone's
 * existing payout destination.
 */
export function useAutoSyncPayoutAddresses() {
  const queryClient = useQueryClient();
  const connectedAddress = useConnectedAddress();
  const connections = useWalletStore((s) => s.connections);
  const { data } = useCreatorProfile(connectedAddress ?? undefined);
  const attemptedFor = useRef<string | null>(null);

  useEffect(() => {
    const creator = data?.creator;
    if (!creator || !connectedAddress) return;

    const missingChains = (["aptos", "ethereum", "solana"] as ChainId[]).filter(
      (chain) => connections[chain].address && !creator.payoutAddress[chain],
    );
    if (missingChains.length === 0) return;

    const attemptKey = `${creator.id}:${missingChains.join(",")}`;
    if (attemptedFor.current === attemptKey) return;
    attemptedFor.current = attemptKey;

    saveCreator({
      ...creator,
      payoutAddress: {
        aptos: connections.aptos.address ?? creator.payoutAddress.aptos,
        ethereum: connections.ethereum.address ?? creator.payoutAddress.ethereum,
        solana: connections.solana.address ?? creator.payoutAddress.solana,
      },
    })
      .then(() => {
        // Payout addresses are joined into lecture/lecture-list responses
        // server-side, so those cached queries also need invalidating —
        // not just the ["creator", id] one — or an already-open lecture
        // page keeps showing the stale payment options.
        void queryClient.invalidateQueries({ queryKey: ["creator", connectedAddress] });
        void queryClient.invalidateQueries({ queryKey: ["lecture"] });
        void queryClient.invalidateQueries({ queryKey: ["lectures"] });
      })
      .catch(() => {
        attemptedFor.current = null;
      });
  }, [data, connectedAddress, connections, queryClient]);
}

export function useUnlockGrants(params: { walletAddress?: string; lectureId?: string; creatorId?: string }) {
  return useQuery({
    queryKey: ["unlock-grants", params],
    queryFn: () => fetchUnlockGrants(params),
    enabled: Boolean(params.walletAddress || params.lectureId || params.creatorId),
  });
}

/**
 * Whether the connected wallet(s) have paid for a lecture, checked across
 * *every* connected chain rather than a single preferred address.
 *
 * A grant is keyed by whichever chain was used to pay (aptos/ethereum/solana
 * each have independent addresses), but `useConnectedAddress()` always
 * resolves to one address in aptos → ethereum → solana priority order. If a
 * user pays with ETH or SOL while an Aptos wallet is also connected, a
 * lookup by that single preferred address would never match the grant and
 * the lecture would look permanently locked. Fetching by lectureId alone and
 * matching each grant against its own chain's connected address avoids that.
 */
export function useIsLectureUnlocked(lectureId: string | undefined) {
  const connections = useWalletStore((s) => s.connections);
  const { data: grants, isLoading } = useUnlockGrants({ lectureId });
  const isUnlocked = Boolean(
    grants?.some((g) => {
      const address = connections[g.chain].address;
      return address && address.toLowerCase() === g.walletAddress.toLowerCase();
    }),
  );
  return { isUnlocked, isLoading };
}
