export type ChainId = "aptos" | "ethereum" | "solana";

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  title: string;
  bio?: string;
  payoutAddress: Partial<Record<ChainId, string>>;
}

export interface LectureRecord {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category: string;
  categoryTone: "primary" | "secondary" | "tertiary" | "error" | "neutral";
  tags: string[];
  outcomes: string[];
  moduleTitle: string;
  durationSeconds: number;
  thumbnailUrl: string;
  creatorId: string;
  priceUsd: number;
  chain: ChainId;
  /** Real Shelby blob path: <account>/courses/<courseId>/<lectureId>/<file> */
  manifestPath: string;
  expirationMicros: number;
  publishedAt: string;
  includes: string[];
}

export interface UnlockGrantRecord {
  lectureId: string;
  walletAddress: string;
  chain: ChainId;
  txHash: string;
  amountUsd: number;
  unlockedAt: string;
}
