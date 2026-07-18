import type { ChainId, Creator, LectureDetail, LectureSummary, UnlockGrant } from "@/types";
import { API_BASE_URL, resolveApiUrl } from "@/lib/apiBase";

/** Thin fetch wrapper over the v1 off-chain index (../server). Every
 * function here is the seam to swap for an Aptos indexer/GraphQL query
 * once course metadata + unlock grants move on-chain. */

interface RawLecture {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category: string;
  categoryTone: LectureSummary["categoryTone"];
  tags: string[];
  outcomes: string[];
  moduleTitle: string;
  durationSeconds: number;
  thumbnailUrl: string;
  creatorId: string;
  priceUsd: number;
  chain: ChainId;
  manifestPath: string;
  expirationMicros: number;
  publishedAt: string;
  includes: string[];
}

interface RawCreator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  title: string;
  bio?: string;
  payoutAddress: Partial<Record<ChainId, string>>;
}

function toCreator(raw: RawCreator): Creator {
  return {
    id: raw.id,
    name: raw.name,
    handle: raw.handle,
    avatarUrl: raw.avatarUrl,
    title: raw.title,
    bio: raw.bio,
    payoutAddress: { aptos: raw.payoutAddress.aptos ?? null, ethereum: raw.payoutAddress.ethereum ?? null, solana: raw.payoutAddress.solana ?? null },
  };
}

function durationLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function toSummary(raw: RawLecture, creators: RawCreator[]): LectureSummary {
  const creator = creators.find((c) => c.id === raw.creatorId);
  return {
    id: raw.id,
    courseId: raw.courseId,
    title: raw.title,
    category: raw.category,
    categoryTone: raw.categoryTone,
    durationLabel: durationLabel(raw.durationSeconds),
    durationSeconds: raw.durationSeconds,
    thumbnailUrl: resolveApiUrl(raw.thumbnailUrl),
    creator: creator
      ? { id: creator.id, name: creator.name, avatarUrl: creator.avatarUrl, title: creator.title }
      : { id: raw.creatorId, name: "Unknown creator", avatarUrl: "", title: "" },
    price: { usd: raw.priceUsd },
    chain: raw.chain,
    expirationMicros: raw.expirationMicros,
    publishedAt: raw.publishedAt,
  };
}

function toDetail(raw: RawLecture, creators: RawCreator[]): LectureDetail {
  return {
    ...toSummary(raw, creators),
    description: raw.description,
    outcomes: raw.outcomes,
    moduleTitle: raw.moduleTitle,
    tags: raw.tags,
    manifestPath: raw.manifestPath,
    includes: raw.includes,
  };
}

const BASE = `${API_BASE_URL}/api/catalog`;

export async function fetchLectures(params: { q?: string; category?: string; chain?: ChainId; creatorId?: string } = {}): Promise<{ lectures: LectureSummary[]; creators: Creator[] }> {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.category) usp.set("category", params.category);
  if (params.chain) usp.set("chain", params.chain);
  if (params.creatorId) usp.set("creatorId", params.creatorId);
  const res = await fetch(`${BASE}/lectures?${usp.toString()}`);
  if (!res.ok) throw new Error(`Failed to load lectures: ${res.status}`);
  const data: { lectures: RawLecture[]; creators: RawCreator[] } = await res.json();
  return { lectures: data.lectures.map((l) => toSummary(l, data.creators)), creators: data.creators.map(toCreator) };
}

export async function fetchLecture(id: string): Promise<{ lecture: LectureDetail; creator: Creator | null }> {
  const res = await fetch(`${BASE}/lectures/${id}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`Failed to load lecture: ${res.status}`);
  const data: { lecture: RawLecture; creator: RawCreator | null } = await res.json();
  return { lecture: toDetail(data.lecture, data.creator ? [data.creator] : []), creator: data.creator ? toCreator(data.creator) : null };
}

export async function fetchCreator(id: string): Promise<{ creator: Creator; lectures: LectureSummary[] }> {
  const res = await fetch(`${BASE}/creators/${id}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`Failed to load creator: ${res.status}`);
  const data: { creator: RawCreator; lectures: RawLecture[] } = await res.json();
  return { creator: toCreator(data.creator), lectures: data.lectures.map((l) => toSummary(l, [data.creator])) };
}

export async function fetchUnlockGrants(params: { walletAddress?: string; lectureId?: string; creatorId?: string }): Promise<UnlockGrant[]> {
  const usp = new URLSearchParams();
  if (params.walletAddress) usp.set("walletAddress", params.walletAddress);
  if (params.lectureId) usp.set("lectureId", params.lectureId);
  if (params.creatorId) usp.set("creatorId", params.creatorId);
  const res = await fetch(`${BASE}/unlock-grants?${usp.toString()}`);
  if (!res.ok) throw new Error(`Failed to load unlock grants: ${res.status}`);
  const data: { grants: Array<{ lectureId: string; walletAddress: string; chain: ChainId; txHash: string; amountUsd: number; unlockedAt: string }> } = await res.json();
  return data.grants.map((g) => ({ lectureId: g.lectureId, walletAddress: g.walletAddress, chain: g.chain, txHash: g.txHash, amount: g.amountUsd, unlockedAt: g.unlockedAt }));
}

export async function extendLectureExpiration(id: string, expirationMicros: number): Promise<void> {
  const res = await fetch(`${BASE}/lectures/${id}/expiration`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expirationMicros }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Renew failed (${res.status})`);
  }
}

export async function deleteLecture(id: string, walletAddress: string): Promise<{ deletedBlobs: number }> {
  const res = await fetch(`${BASE}/lectures/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to delete lecture: ${res.status}`);
  }
  return res.json();
}

export async function recordUnlockGrant(grant: UnlockGrant): Promise<void> {
  const res = await fetch(`${BASE}/unlock-grants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lectureId: grant.lectureId, walletAddress: grant.walletAddress, chain: grant.chain, txHash: grant.txHash, amountUsd: grant.amount, unlockedAt: grant.unlockedAt }),
  });
  if (!res.ok) throw new Error(`Failed to record unlock grant: ${res.status}`);
}
