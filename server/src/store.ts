import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CatalogDB } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "catalog.json");

/** Where auto-captured lecture thumbnail frames are persisted — served back
 * via /api/thumbnails. Not Shelby storage: thumbnails are small, disposable
 * previews, not paid content, so there's no reason to spend ShelbyUSD on them. */
export const THUMBNAILS_DIR = path.join(__dirname, "..", "data", "thumbnails");

export async function ensureThumbnailsDir(): Promise<void> {
  await mkdir(THUMBNAILS_DIR, { recursive: true });
}

/**
 * v1 off-chain index: a flat JSON file standing in for a real database/indexer.
 * TODO(on-chain-v2): replace with reads against Aptos indexer/GraphQL once a
 * Move module for course metadata + unlock grants is designed. Every reader
 * in this file is the seam to swap when that lands.
 */
const EMPTY_DB: CatalogDB = { creators: [], lectures: [], unlockGrants: [] };

export async function readDB(): Promise<CatalogDB> {
  try {
    const raw = await readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as CatalogDB;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await writeDB(EMPTY_DB);
      return { ...EMPTY_DB };
    }
    throw err;
  }
}

export async function writeDB(db: CatalogDB): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}
