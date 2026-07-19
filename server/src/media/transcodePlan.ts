import { hlsCmaf } from "@shelby-protocol/media-prepare/core";
import { execFfmpeg, mapNamesToDirs, NodeMediaProbe, SystemChecker } from "@shelby-protocol/media-prepare/node";

/**
 * Ladder tiers, keyed by short-side (the dimension that actually reflects
 * quality regardless of orientation). Deliberately a single small rung —
 * this runs on a free burstable-CPU VM (e.g. GCP e2-micro), which throttles
 * hard under sustained encode load once its burst credit runs out, so
 * every additional rendition roughly multiplies real-world transcode time.
 * Swap for `hlsCmaf.presets.vodHd_1080p` (or add rungs back) once this runs
 * somewhere with a real dedicated vCPU.
 */
const LADDER_TIERS = [{ shortSide: 480, bitrateBps: 1_200_000, name: "480p" }];

interface LadderRung {
  width: number;
  height: number;
  bitrateBps: number;
  name: string;
}

function evenFloor(n: number): number {
  const r = Math.floor(n);
  return r % 2 === 0 ? r : r - 1;
}

/**
 * Builds a ladder that preserves the source's aspect ratio instead of
 * force-fitting every upload into 16:9 (the ffmpeg `scale=w:h` filter this
 * plan compiles to stretches/squashes to exact dimensions with no
 * letterboxing). Each tier is sized off the source's short side and never
 * upscales past it; identical rungs from clamping are de-duplicated.
 */
function buildAdaptiveLadder(sourceWidth: number, sourceHeight: number): LadderRung[] {
  const isPortrait = sourceHeight > sourceWidth;
  const shortSideSource = Math.min(sourceWidth, sourceHeight);
  const longSideSource = Math.max(sourceWidth, sourceHeight);

  const rungs = LADDER_TIERS.map((tier) => {
    const shortSide = evenFloor(Math.min(tier.shortSide, shortSideSource));
    const longSide = evenFloor(shortSide * (longSideSource / shortSideSource));
    return {
      width: isPortrait ? shortSide : longSide,
      height: isPortrait ? longSide : shortSide,
      bitrateBps: tier.bitrateBps,
      name: tier.name,
    };
  });

  return rungs.filter((r, i) => i === 0 || r.width !== rungs[i - 1].width || r.height !== rungs[i - 1].height);
}

export async function assertFfmpegAvailable(): Promise<void> {
  const requirements = await SystemChecker.checkRequirements();
  if (!requirements.ffmpeg || !requirements.ffmpegVersionValid) {
    throw new Error(
      "System FFmpeg not found or too old (v7+ required). Install it and ensure it's on PATH — see SETUP.md.",
    );
  }
}

export interface TranscodeResult {
  outputDir: string;
  masterPlaylistName: string;
}

/** Builds the CMAF/HLS plan and runs it via a single real ffmpeg invocation
 * (this package's actual API packages while it transcodes, rather than a
 * separate transcode-then-package pass). */
export async function runTranscode(inputPath: string, outputDir: string): Promise<TranscodeResult> {
  const probe = await new NodeMediaProbe().probe(inputPath);
  const { width: sourceWidth, height: sourceHeight } = probe.video ?? {};
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Could not read source video dimensions (ffprobe found no video stream).");
  }
  const ladder = buildAdaptiveLadder(sourceWidth, sourceHeight);

  const builder = hlsCmaf
    .planHlsCmaf()
    .input(inputPath)
    .outputDir(outputDir)
    .withLadder(ladder)
    // "ultrafast" trades compression efficiency (bigger files) for raw
    // encode speed — the right tradeoff on CPU-constrained free hosting.
    .withVideoEncoder(hlsCmaf.x264({ preset: "ultrafast" }))
    .withAudio(hlsCmaf.aac({ sampleRate: 48000 }), { language: "eng", bitrateBps: 128_000, default: true })
    .withSegmentsFixed(6)
    .hlsCmaf({ masterName: "master.m3u8" });

  const plan = builder.build();
  // `render` lives on the builder chain, not on the Plan returned by build().
  const { args, outputDir: renderedOutputDir, variantNames } = builder.render.ffmpegArgs();
  await execFfmpeg(args, {
    cwd: renderedOutputDir,
    precreate: mapNamesToDirs(renderedOutputDir, variantNames),
    silent: true, // set false to debug — pipes ffmpeg's real stderr to this process's console
  });

  return { outputDir: renderedOutputDir, masterPlaylistName: plan.packaging.masterName };
}
