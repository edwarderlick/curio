import { useQuery } from "@tanstack/react-query";
import type { ChainId } from "@/types";
import { useWalletStore } from "@/features/wallet/store";
import { fetchCreator, fetchLecture, fetchLectures, fetchUnlockGrants } from "./catalogClient";

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
