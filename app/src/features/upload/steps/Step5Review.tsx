import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadBlobs } from "@shelby-protocol/react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useConnectedAddress, useStorageSigner, useWalletStore } from "@/features/wallet/store";
import { API_BASE_URL } from "@/lib/apiBase";
import { getBlobUrl } from "@/lib/shelby/blobUrl";
import { CATEGORY_TONE, type UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  onBack: () => void;
}

const BASE = `${API_BASE_URL}/api/catalog`;

/** Reads real duration from the source file via the browser's video decoder —
 * not a fabricated placeholder. */
function useVideoDuration(file: File | null) {
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setSeconds(video.duration);
      URL.revokeObjectURL(url);
    };
    video.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return seconds;
}

/** Grabs a real frame from partway through the source file (via a hidden
 * <video> + <canvas>) instead of a static stock placeholder, so every
 * lecture card shows something that's actually from that video. */
function useVideoThumbnail(file: File | null) {
  const [blob, setBlob] = useState<Blob | null>(null);
  useEffect(() => {
    setBlob(null);
    if (!file) return;
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const capture = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => {
          if (!cancelled && b) setBlob(b);
        },
        "image/jpeg",
        0.85,
      );
    };
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };
    video.onseeked = capture;
    video.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);
  return blob;
}

export function Step5Review({ form, onBack }: StepProps) {
  const navigate = useNavigate();
  const connections = useWalletStore((s) => s.connections);
  const { signer, storageAccountAddress } = useStorageSigner();
  const uploadBlobs = useUploadBlobs({});
  const durationSeconds = useVideoDuration(form.file);
  const thumbnailBlob = useVideoThumbnail(form.file);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!thumbnailBlob) return;
    const url = URL.createObjectURL(thumbnailBlob);
    setThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailBlob]);

  const connectedAddress = useConnectedAddress();

  async function handlePublish() {
    if (!connectedAddress || !form.manifestPath || durationSeconds == null) return;
    setPublishing(true);
    setError(null);
    try {
      const creatorId = connectedAddress;
      const payoutAddress: Record<string, string | undefined> = {
        aptos: connections.aptos.address ?? undefined,
        ethereum: connections.ethereum.address ?? undefined,
        solana: connections.solana.address ?? undefined,
      };

      await fetch(`${BASE}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: creatorId,
          name: form.creatorName,
          handle: form.creatorHandle,
          avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(creatorId)}`,
          title: "Curio Creator",
          payoutAddress,
        }),
      });

      const expirationMicros = Date.now() * 1000 + form.storageDays * 86_400 * 1_000_000;

      let thumbnailUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800";
      if (thumbnailBlob && signer && storageAccountAddress) {
        const blobName = `thumbnails/${form.courseId}/${crypto.randomUUID()}.jpg`;
        const blobData = new Uint8Array(await thumbnailBlob.arrayBuffer());
        await uploadBlobs.mutateAsync({ signer, blobs: [{ blobName, blobData }], expirationMicros });
        thumbnailUrl = getBlobUrl(`${storageAccountAddress}/${blobName}`);
      }

      const res = await fetch(`${BASE}/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: form.courseId,
          title: form.title,
          description: form.description,
          category: form.category,
          categoryTone: CATEGORY_TONE[form.category] ?? "neutral",
          tags: [form.category],
          outcomes: [],
          moduleTitle: form.title,
          durationSeconds: Math.round(durationSeconds),
          thumbnailUrl,
          creatorId,
          priceUsd: form.priceUsd,
          chain: form.chain,
          manifestPath: form.manifestPath,
          expirationMicros,
          includes: ["1 Premium Micro-Lecture"],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Publish failed");
      const { lecture } = await res.json();
      navigate(`/lecture/${lecture.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <GlassPanel className="p-8 space-y-4">
        <div className="aspect-video rounded-2xl overflow-hidden bg-surface-container-high flex items-center justify-center">
          {thumbnailPreviewUrl ? (
            <img src={thumbnailPreviewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-on-surface-variant font-label-sm text-label-sm">Capturing thumbnail…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={CATEGORY_TONE[form.category] ?? "neutral"}>{form.category}</Chip>
        </div>
        <h2 className="font-headline-md text-headline-md text-white">{form.title || "Untitled lecture"}</h2>
        <p className="text-on-surface-variant font-body-md">{form.description}</p>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-body-md">
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Creator</p>
            <p className="text-white">{form.creatorName || "—"}</p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Price</p>
            <p className="text-white">${form.priceUsd.toFixed(2)} USD</p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Duration</p>
            <p className="text-white">{durationSeconds != null ? `${Math.round(durationSeconds)}s` : "Reading..."}</p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Storage</p>
            <p className="text-white">{form.storageDays} days on Shelbynet</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/5">
          <p className="text-label-sm font-label-sm text-on-surface-variant">Manifest</p>
          <p className="text-secondary-fixed font-label-sm text-label-sm break-all">{form.manifestPath}</p>
        </div>
      </GlassPanel>

      {!connectedAddress && <p className="text-error font-label-sm text-label-sm text-center">Connect a wallet to publish.</p>}
      {error && <p className="text-error font-label-sm text-label-sm text-center break-words">{error}</p>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={publishing}>
          Back
        </Button>
        <Button className="flex-1" size="lg" loading={publishing} disabled={!connectedAddress || durationSeconds == null} onClick={handlePublish}>
          Publish Lecture
        </Button>
      </div>
    </div>
  );
}
