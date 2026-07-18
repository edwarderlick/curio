export type ChainId = "aptos" | "ethereum" | "solana";

/** Price is stored chain-agnostic (USD-denominated base value) and converted
 * for display per connected chain — see Step 7 pricing model. */
export interface Price {
  usd: number;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  title: string;
  bio?: string;
  /** Native per-chain wallet address (Aptos address / ETH EOA / Solana
   * pubkey) — both the payment recipient for checkout and, via DAA, the
   * seed the creator's Shelby storage account is deterministically derived
   * from. Null until the creator has connected that chain. */
  payoutAddress: Record<ChainId, string | null>;
}

export interface LectureSummary {
  id: string;
  courseId: string;
  title: string;
  category: string;
  categoryTone: "primary" | "secondary" | "tertiary" | "error" | "neutral";
  durationLabel: string;
  durationSeconds: number;
  thumbnailUrl: string;
  creator: Pick<Creator, "id" | "name" | "avatarUrl" | "title">;
  price: Price;
  chain: ChainId;
  expirationMicros: number;
  publishedAt: string;
  trending?: boolean;
  progressPct?: number;
}

export interface LectureDetail extends LectureSummary {
  description: string;
  outcomes: string[];
  moduleTitle: string;
  tags: string[];
  manifestPath: string;
  includes: string[];
}

/** v1: unlock grants are recorded off-chain, keyed by wallet address + lecture id.
 * TODO(on-chain-v2): move this to an Aptos resource/table once the access-control
 * Move module is designed — see server/lib/unlockStore for the swap point. */
export interface UnlockGrant {
  lectureId: string;
  walletAddress: string;
  chain: ChainId;
  txHash: string;
  amount: number;
  unlockedAt: string;
}
