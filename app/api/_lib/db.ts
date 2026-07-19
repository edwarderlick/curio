import { neon } from "@neondatabase/serverless";
import type { ChainId, Creator, LectureRecord, UnlockGrantRecord } from "./types.js";

/**
 * v2 catalog index: Postgres (Neon, via Vercel's native storage integration)
 * instead of a JSON file on a server's local disk — the whole point of
 * moving off the Express server is that nothing here should need a
 * persistent process. Tables are created lazily on first use so there's no
 * separate migration step to run before a demo. `fullResults: true` makes
 * every query return `{ rows, rowCount }` like node-postgres/`@vercel/postgres`
 * did, so the query helpers below don't need their own shape.
 */
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (or POSTGRES_URL) is not set — add a Neon/Postgres database in the Vercel project's Storage tab.");
}
const sql = neon(connectionString, { fullResults: true });

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS creators (
          id text PRIMARY KEY,
          name text NOT NULL,
          handle text NOT NULL,
          avatar_url text NOT NULL,
          title text NOT NULL,
          bio text,
          payout_address jsonb NOT NULL DEFAULT '{}'::jsonb
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS lectures (
          id text PRIMARY KEY,
          course_id text NOT NULL,
          title text NOT NULL,
          description text NOT NULL,
          category text NOT NULL,
          category_tone text NOT NULL,
          tags text[] NOT NULL DEFAULT '{}',
          outcomes text[] NOT NULL DEFAULT '{}',
          module_title text NOT NULL,
          duration_seconds integer NOT NULL,
          thumbnail_url text NOT NULL,
          creator_id text NOT NULL REFERENCES creators(id),
          price_usd numeric NOT NULL,
          chain text NOT NULL,
          manifest_path text NOT NULL,
          expiration_micros bigint NOT NULL,
          published_at timestamptz NOT NULL DEFAULT now(),
          includes text[] NOT NULL DEFAULT '{}'
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS unlock_grants (
          tx_hash text PRIMARY KEY,
          lecture_id text NOT NULL REFERENCES lectures(id),
          wallet_address text NOT NULL,
          chain text NOT NULL,
          amount_usd numeric NOT NULL,
          unlocked_at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return schemaReady;
}

interface CreatorRow {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  title: string;
  bio: string | null;
  payout_address: Partial<Record<ChainId, string>>;
}

function toCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
    title: row.title,
    bio: row.bio ?? undefined,
    payoutAddress: row.payout_address ?? {},
  };
}

interface LectureRow {
  id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  category_tone: LectureRecord["categoryTone"];
  tags: string[];
  outcomes: string[];
  module_title: string;
  duration_seconds: number;
  thumbnail_url: string;
  creator_id: string;
  price_usd: string;
  chain: ChainId;
  manifest_path: string;
  expiration_micros: string;
  published_at: string;
  includes: string[];
}

function toLecture(row: LectureRow): LectureRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    category: row.category,
    categoryTone: row.category_tone,
    tags: row.tags ?? [],
    outcomes: row.outcomes ?? [],
    moduleTitle: row.module_title,
    durationSeconds: row.duration_seconds,
    thumbnailUrl: row.thumbnail_url,
    creatorId: row.creator_id,
    priceUsd: Number(row.price_usd),
    chain: row.chain,
    manifestPath: row.manifest_path,
    expirationMicros: Number(row.expiration_micros),
    publishedAt: new Date(row.published_at).toISOString(),
    includes: row.includes ?? [],
  };
}

export async function listLectures(filters: { q?: string; category?: string; chain?: string; creatorId?: string; courseId?: string }): Promise<LectureRecord[]> {
  await ensureSchema();
  const { q, category, chain, creatorId, courseId } = filters;
  const needle = q?.trim() ? `%${q.trim().toLowerCase()}%` : null;
  const { rows } = await sql`
    SELECT * FROM lectures
    WHERE (${needle}::text IS NULL OR lower(title) LIKE ${needle} OR lower(category) LIKE ${needle} OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE lower(t) LIKE ${needle}))
      AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
      AND (${chain ?? null}::text IS NULL OR chain = ${chain ?? null})
      AND (${creatorId ?? null}::text IS NULL OR creator_id = ${creatorId ?? null})
      AND (${courseId ?? null}::text IS NULL OR course_id = ${courseId ?? null})
    ORDER BY published_at DESC
  `;
  return (rows as LectureRow[]).map(toLecture);
}

export async function getLecture(id: string): Promise<LectureRecord | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM lectures WHERE id = ${id}`;
  return rows[0] ? toLecture(rows[0] as LectureRow) : null;
}

export async function getCreator(id: string): Promise<Creator | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM creators WHERE id = ${id}`;
  return rows[0] ? toCreator(rows[0] as CreatorRow) : null;
}

export async function listCreatorsByIds(ids: string[]): Promise<Creator[]> {
  await ensureSchema();
  if (ids.length === 0) return [];
  const { rows } = await sql`SELECT * FROM creators WHERE id = ANY(${ids})`;
  return (rows as CreatorRow[]).map(toCreator);
}

export async function listAllCreators(): Promise<Creator[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM creators`;
  return (rows as CreatorRow[]).map(toCreator);
}

export async function insertLecture(input: Omit<LectureRecord, "id" | "publishedAt">): Promise<LectureRecord | { error: string }> {
  await ensureSchema();
  const creator = await getCreator(input.creatorId);
  if (!creator) return { error: "Unknown creatorId — create the creator profile first" };

  const id = crypto.randomUUID();
  const publishedAt = new Date().toISOString();
  await sql`
    INSERT INTO lectures (id, course_id, title, description, category, category_tone, tags, outcomes, module_title, duration_seconds, thumbnail_url, creator_id, price_usd, chain, manifest_path, expiration_micros, published_at, includes)
    VALUES (${id}, ${input.courseId}, ${input.title}, ${input.description}, ${input.category}, ${input.categoryTone}, ${input.tags}, ${input.outcomes}, ${input.moduleTitle}, ${input.durationSeconds}, ${input.thumbnailUrl}, ${input.creatorId}, ${input.priceUsd}, ${input.chain}, ${input.manifestPath}, ${input.expirationMicros}, ${publishedAt}, ${input.includes})
  `;
  return { ...input, id, publishedAt };
}

export async function patchLectureExpiration(id: string, expirationMicros: number): Promise<LectureRecord | null> {
  await ensureSchema();
  const { rowCount } = await sql`UPDATE lectures SET expiration_micros = ${expirationMicros} WHERE id = ${id}`;
  if (!rowCount) return null;
  return getLecture(id);
}

export async function deleteLectureRecord(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM unlock_grants WHERE lecture_id = ${id}`;
  await sql`DELETE FROM lectures WHERE id = ${id}`;
}

export async function upsertCreator(input: Creator): Promise<Creator | { error: string }> {
  await ensureSchema();
  const existing = await getCreator(input.id);
  if (existing) {
    for (const [chain, currentAddr] of Object.entries(existing.payoutAddress)) {
      const incomingAddr = input.payoutAddress[chain as ChainId];
      if (currentAddr && incomingAddr && incomingAddr !== currentAddr) {
        return { error: `payoutAddress.${chain} is already set and can't be changed via this endpoint` };
      }
    }
    const mergedPayout = { ...input.payoutAddress, ...existing.payoutAddress };
    await sql`
      UPDATE creators SET name = ${input.name}, handle = ${input.handle}, avatar_url = ${input.avatarUrl}, title = ${input.title}, bio = ${input.bio ?? null}, payout_address = ${JSON.stringify(mergedPayout)}
      WHERE id = ${input.id}
    `;
    return (await getCreator(input.id)) as Creator;
  }
  await sql`
    INSERT INTO creators (id, name, handle, avatar_url, title, bio, payout_address)
    VALUES (${input.id}, ${input.name}, ${input.handle}, ${input.avatarUrl}, ${input.title}, ${input.bio ?? null}, ${JSON.stringify(input.payoutAddress)})
  `;
  return input;
}

interface UnlockGrantRow {
  tx_hash: string;
  lecture_id: string;
  wallet_address: string;
  chain: ChainId;
  amount_usd: string;
  unlocked_at: string;
}

function toGrant(row: UnlockGrantRow): UnlockGrantRecord {
  return {
    lectureId: row.lecture_id,
    walletAddress: row.wallet_address,
    chain: row.chain,
    txHash: row.tx_hash,
    amountUsd: Number(row.amount_usd),
    unlockedAt: new Date(row.unlocked_at).toISOString(),
  };
}

export async function listUnlockGrants(filters: { walletAddress?: string; lectureId?: string; creatorId?: string }): Promise<UnlockGrantRecord[]> {
  await ensureSchema();
  const { walletAddress, lectureId, creatorId } = filters;
  const { rows } = await sql`
    SELECT g.* FROM unlock_grants g
    LEFT JOIN lectures l ON l.id = g.lecture_id
    WHERE (${walletAddress ?? null}::text IS NULL OR lower(g.wallet_address) = lower(${walletAddress ?? null}))
      AND (${lectureId ?? null}::text IS NULL OR g.lecture_id = ${lectureId ?? null})
      AND (${creatorId ?? null}::text IS NULL OR l.creator_id = ${creatorId ?? null})
  `;
  return (rows as UnlockGrantRow[]).map(toGrant);
}

export async function grantExistsForTx(txHash: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`SELECT 1 FROM unlock_grants WHERE tx_hash = ${txHash}`;
  return rows.length > 0;
}

export async function insertUnlockGrant(grant: UnlockGrantRecord): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO unlock_grants (tx_hash, lecture_id, wallet_address, chain, amount_usd, unlocked_at)
    VALUES (${grant.txHash}, ${grant.lectureId}, ${grant.walletAddress}, ${grant.chain}, ${grant.amountUsd}, ${grant.unlockedAt})
  `;
}
