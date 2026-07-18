import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Account } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";

export const shelbyNodeClient = new ShelbyNodeClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY || undefined,
});

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

/**
 * Uploads every file under `localDir` to Shelby as a real blob at
 * `<blobPrefix>/<relativePath>`, signed by `signer`. Reports real per-file
 * progress via `onProgress` — no simulated percentages.
 */
export async function uploadDirectoryToShelby(
  localDir: string,
  blobPrefix: string,
  signer: Account,
  expirationMicros: number,
  onProgress: (uploaded: number, total: number, currentFile: string) => void,
): Promise<void> {
  const files = await walk(localDir);
  let uploaded = 0;
  for (const file of files) {
    const relative = path.relative(localDir, file).split(path.sep).join("/");
    const blobName = `${blobPrefix}/${relative}`;
    const data = await readFile(file);
    onProgress(uploaded, files.length, relative);
    await shelbyNodeClient.upload({
      blobData: new Uint8Array(data),
      signer,
      blobName,
      expirationMicros,
    });
    uploaded += 1;
    onProgress(uploaded, files.length, relative);
  }
}

/**
 * Deletes every blob registered under `<signer>/<blobPrefix>/` — i.e. every
 * segment/playlist file a lecture's upload registered on-chain. Looks the
 * blob names up from the indexer rather than requiring the caller to have
 * kept the original file list around (the local transcode output directory
 * is deleted right after upload). Returns how many blobs were deleted.
 */
export async function deleteLectureBlobs(blobPrefix: string, signer: Account): Promise<number> {
  const likePattern = `${signer.accountAddress.toString()}/${blobPrefix}/%`;
  const blobs = await shelbyNodeClient.coordination.getAccountBlobs({
    account: signer.accountAddress,
    where: { blob_name: { _like: likePattern } },
  });
  if (blobs.length === 0) return 0;
  await shelbyNodeClient.coordination.deleteMultipleBlobs({
    account: signer,
    blobNames: blobs.map((b) => b.blobNameSuffix),
  });
  return blobs.length;
}
