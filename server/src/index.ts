import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import os from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { ensureThumbnailsDir, readDB, THUMBNAILS_DIR, writeDB } from "./store.js";
import type { LectureRecord, UnlockGrantRecord } from "./types.js";
import { jobBus } from "./jobs.js";
import { assertFfmpegAvailable, runTranscode } from "./media/transcodePlan.js";
import { loadCliAccount } from "./media/shelbySigner.js";
import { deleteLectureBlobs, uploadDirectoryToShelby } from "./media/shelbyUpload.js";
import { verifyOnChainTransfer } from "./media/paymentVerify.js";

const app = express();
// CORS_ORIGIN: comma-separated allowed origins for production (e.g. the
// Vercel-hosted app's real URL). Unset in dev, which keeps today's
// wide-open behavior so the Vite proxy setup doesn't need any config.
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins && allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: "10mb" }));

// Generous general limit for reads; a tighter one below on the routes that
// write data, cost real money (Shelby storage), or run ffmpeg.
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
// Real ffmpeg CPU + real ShelbyUSD spend per request — much tighter cap.
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const upload = multer({ dest: path.join(os.tmpdir(), "curio-uploads") });

await ensureThumbnailsDir();
app.use("/api/thumbnails", express.static(THUMBNAILS_DIR));

// ---- Catalog reads --------------------------------------------------------

app.get("/api/catalog/lectures", async (req, res) => {
  const db = await readDB();
  const { q, category, chain, creatorId, courseId } = req.query;
  let lectures = db.lectures;

  if (typeof q === "string" && q.trim()) {
    const needle = q.toLowerCase();
    lectures = lectures.filter(
      (l) => l.title.toLowerCase().includes(needle) || l.category.toLowerCase().includes(needle) || l.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }
  if (typeof category === "string") lectures = lectures.filter((l) => l.category === category);
  if (typeof chain === "string") lectures = lectures.filter((l) => l.chain === chain);
  if (typeof creatorId === "string") lectures = lectures.filter((l) => l.creatorId === creatorId);
  if (typeof courseId === "string") lectures = lectures.filter((l) => l.courseId === courseId);

  res.json({ lectures, creators: db.creators });
});

app.get("/api/catalog/lectures/:id", async (req, res) => {
  const db = await readDB();
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });
  const creator = db.creators.find((c) => c.id === lecture.creatorId) ?? null;
  res.json({ lecture, creator });
});

app.get("/api/catalog/creators/:id", async (req, res) => {
  const db = await readDB();
  const creator = db.creators.find((c) => c.id === req.params.id);
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  const lectures = db.lectures.filter((l) => l.creatorId === creator.id);
  res.json({ creator, lectures });
});

// ---- Publish (called by the Studio upload wizard, Step 7) -----------------

app.post("/api/catalog/lectures", mutationLimiter, async (req, res) => {
  const db = await readDB();
  const body = req.body as Omit<LectureRecord, "id" | "publishedAt">;

  const creator = db.creators.find((c) => c.id === body.creatorId);
  if (!creator) return res.status(400).json({ error: "Unknown creatorId — create the creator profile first" });

  const lecture: LectureRecord = {
    ...body,
    id: randomUUID(),
    publishedAt: new Date().toISOString(),
  };
  db.lectures.push(lecture);
  await writeDB(db);
  res.status(201).json({ lecture });
});

app.patch("/api/catalog/lectures/:id/expiration", mutationLimiter, async (req, res) => {
  const db = await readDB();
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });
  const { expirationMicros } = req.body as { expirationMicros: number };
  lecture.expirationMicros = expirationMicros;
  await writeDB(db);
  res.json({ lecture });
});

/** Real deletion: removes every blob the lecture's upload registered on
 * Shelbynet (not just the catalog record), so this genuinely frees the
 * creator's prepaid storage rather than just hiding the listing. */
app.delete("/api/catalog/lectures/:id", mutationLimiter, async (req, res) => {
  const db = await readDB();
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  const { walletAddress } = req.body as { walletAddress?: string };
  if (!walletAddress || walletAddress.toLowerCase() !== lecture.creatorId.toLowerCase()) {
    return res.status(403).json({ error: "Only the publishing creator can delete this lecture" });
  }

  try {
    const signer = await loadCliAccount(process.env.SHELBY_CLI_ACCOUNT_NAME || "dev");
    const blobPrefix = `courses/${lecture.courseId}/${lecture.id}`;
    const deletedBlobs = await deleteLectureBlobs(blobPrefix, signer);

    db.lectures = db.lectures.filter((l) => l.id !== lecture.id);
    db.unlockGrants = db.unlockGrants.filter((g) => g.lectureId !== lecture.id);
    await writeDB(db);

    res.json({ deletedBlobs });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/** Payout addresses are financial routing info — an anonymous upsert can't
 * silently redirect an existing creator's already-set payout address to a
 * different one (that would let anyone reroute a creator's future earnings
 * just by knowing their public creatorId, which is their wallet address).
 * New chains can still be added; profile fields (name, avatar, etc.) stay
 * freely editable. */
app.post("/api/catalog/creators", mutationLimiter, async (req, res) => {
  const db = await readDB();
  const creator = req.body as CatalogCreatorInput;
  const existing = db.creators.find((c) => c.id === creator.id);
  if (existing) {
    for (const [chain, currentAddr] of Object.entries(existing.payoutAddress)) {
      const incomingAddr = creator.payoutAddress[chain];
      if (currentAddr && incomingAddr && incomingAddr !== currentAddr) {
        return res.status(409).json({ error: `payoutAddress.${chain} is already set and can't be changed via this endpoint` });
      }
    }
    Object.assign(existing, creator, { payoutAddress: { ...creator.payoutAddress, ...existing.payoutAddress } });
  } else {
    db.creators.push(creator);
  }
  await writeDB(db);
  res.status(201).json({ creator: existing ?? creator });
});

// ---- Unlock grants (Step 8 payment gating) --------------------------------

app.get("/api/catalog/unlock-grants", async (req, res) => {
  const db = await readDB();
  const { walletAddress, lectureId, creatorId } = req.query;
  let grants = db.unlockGrants;
  if (typeof walletAddress === "string") grants = grants.filter((g) => g.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  if (typeof lectureId === "string") grants = grants.filter((g) => g.lectureId === lectureId);
  if (typeof creatorId === "string") {
    const lectureIds = new Set(db.lectures.filter((l) => l.creatorId === creatorId).map((l) => l.id));
    grants = grants.filter((g) => lectureIds.has(g.lectureId));
  }
  res.json({ grants });
});

/** Verifies the claimed transaction really happened on-chain before granting
 * access — without this, anyone could POST a fabricated or reused txHash
 * and unlock any paid lecture for free. See media/paymentVerify.ts. */
app.post("/api/catalog/unlock-grants", mutationLimiter, async (req, res) => {
  const db = await readDB();
  const grant = req.body as UnlockGrantRecord;

  if (db.unlockGrants.some((g) => g.txHash === grant.txHash)) {
    return res.status(409).json({ error: "This transaction has already been used to unlock a lecture" });
  }

  const lecture = db.lectures.find((l) => l.id === grant.lectureId);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });
  const creator = db.creators.find((c) => c.id === lecture.creatorId);
  const recipient = creator?.payoutAddress[grant.chain];
  if (!recipient) return res.status(400).json({ error: "Creator has no payout address on this chain" });

  const verified = await verifyOnChainTransfer(grant.chain, {
    txHash: grant.txHash,
    sender: grant.walletAddress,
    recipient,
  });
  if (!verified) {
    return res.status(402).json({ error: "Could not verify this payment transaction on-chain" });
  }

  db.unlockGrants.push(grant);
  await writeDB(db);
  res.status(201).json({ grant });
});

// ---- Thumbnails (auto-captured frame from the source video, Step 5) -------
// Not Shelby storage: thumbnails are small, disposable previews rather than
// paid content, so there's no reason to spend ShelbyUSD registering them
// as blobs — they're just served off local disk.

const thumbnailUpload = multer({
  storage: multer.diskStorage({
    destination: THUMBNAILS_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname) || ".jpg"}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post("/api/upload/thumbnail", mutationLimiter, thumbnailUpload.single("thumbnail"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No thumbnail file provided" });
  res.status(201).json({ url: `/api/thumbnails/${req.file.filename}` });
});

// ---- Upload pipeline (Step 7): real transcode + real Shelby blob upload ---

app.post("/api/upload/start", uploadLimiter, upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video file provided" });
  const { courseId, lectureId, expirationMicros } = req.body as {
    courseId?: string;
    lectureId?: string;
    expirationMicros?: string;
  };
  if (!courseId || !lectureId || !expirationMicros) {
    return res.status(400).json({ error: "courseId, lectureId, and expirationMicros are required" });
  }

  const jobId = randomUUID();
  jobBus.create(jobId);
  res.status(202).json({ jobId });

  runUploadPipeline(jobId, req.file.path, courseId, lectureId, Number(expirationMicros)).catch((err) => {
    jobBus.update(jobId, { stage: "error", error: err instanceof Error ? err.message : String(err) });
  });
});

app.get("/api/upload/:jobId/events", (req, res) => {
  const { jobId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (job: ReturnType<typeof jobBus.get>) => {
    if (job) res.write(`data: ${JSON.stringify(job)}\n\n`);
  };
  send(jobBus.get(jobId));

  const listener = (job: NonNullable<ReturnType<typeof jobBus.get>>) => send(job);
  jobBus.on(jobId, listener);
  req.on("close", () => jobBus.off(jobId, listener));
});

async function runUploadPipeline(jobId: string, sourcePath: string, courseId: string, lectureId: string, expirationMicros: number) {
  jobBus.update(jobId, { stage: "uploading_source", message: "Source file received" });
  await assertFfmpegAvailable();

  const outputDir = await mkdtemp(path.join(os.tmpdir(), "curio-transcode-"));
  jobBus.update(jobId, { stage: "transcoding", message: "Transcoding to multi-bitrate HLS..." });
  const { masterPlaylistName } = await runTranscode(sourcePath, outputDir);

  const signer = await loadCliAccount(process.env.SHELBY_CLI_ACCOUNT_NAME || "dev");
  const blobPrefix = `courses/${courseId}/${lectureId}`;

  jobBus.update(jobId, { stage: "uploading_segments", message: "Uploading segments to Shelbynet...", progress: { current: 0, total: 1 } });
  await uploadDirectoryToShelby(outputDir, blobPrefix, signer, expirationMicros, (current, total, file) => {
    jobBus.update(jobId, { stage: "uploading_segments", message: `Uploading ${file}`, progress: { current, total } });
  });

  const manifestPath = `${signer.accountAddress.toString()}/${blobPrefix}/${masterPlaylistName}`;
  jobBus.update(jobId, { stage: "complete", message: "Upload complete", manifestPath });

  await rm(sourcePath, { force: true });
  await rm(outputDir, { recursive: true, force: true });
}

app.listen(PORT, () => {
  console.log(`Curio v1 off-chain index listening on http://localhost:${PORT}`);
});

interface CatalogCreatorInput {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  title: string;
  bio?: string;
  payoutAddress: Record<string, string | undefined>;
}
