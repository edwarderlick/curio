import { useEffect, useRef } from "react";
import { useUploadBlobs } from "@shelby-protocol/react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { useStorageSigner, useWalletStore } from "@/features/wallet/store";
import type { UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  setForm: (patch: Partial<UploadFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Uploads the raw source file straight to Shelby, signed by whichever
 * wallet is connected — no server, no transcode. There's no HLS ladder to
 * build anymore, so this is a single blob write rather than a multi-stage
 * pipeline; the player (see ShelbyVideoPlayer) plays the raw file directly. */
export function Step3Processing({ form, setForm, onNext, onBack }: StepProps) {
  const { signer, storageAccountAddress } = useStorageSigner();
  const openConnectModal = useWalletStore((s) => s.openConnectModal);
  const uploadBlobs = useUploadBlobs({});
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !form.file || !signer || !storageAccountAddress) return;
    started.current = true;

    const file = form.file;
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "mp4";
    const blobName = `courses/${form.courseId}/${crypto.randomUUID()}/source.${extension}`;
    const expirationMicros = Date.now() * 1000 + form.storageDays * 86_400 * 1_000_000;

    setForm({ uploadStatus: "uploading", uploadError: null });

    (async () => {
      try {
        const blobData = new Uint8Array(await file.arrayBuffer());
        await uploadBlobs.mutateAsync({ signer, blobs: [{ blobName, blobData }], expirationMicros });
        setForm({ uploadStatus: "complete", manifestPath: `${storageAccountAddress}/${blobName}` });
      } catch (err) {
        setForm({ uploadStatus: "error", uploadError: err instanceof Error ? err.message : String(err) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, storageAccountAddress]);

  function retry() {
    started.current = false;
    setForm({ uploadStatus: "idle", uploadError: null, manifestPath: null });
  }

  return (
    <div className="space-y-6">
      <GlassPanel className="p-8 space-y-5">
        {!signer || !storageAccountAddress ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <span className="material-symbols-outlined text-4xl text-primary">account_balance_wallet</span>
            <p className="text-white font-body-md">Connect a wallet to upload — Shelby storage writes are signed by your wallet, not a server.</p>
            <Button onClick={openConnectModal}>Connect Wallet</Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                form.uploadStatus === "complete"
                  ? "bg-secondary-container/20 text-secondary-fixed"
                  : form.uploadStatus === "error"
                    ? "bg-error/10 text-error"
                    : "bg-primary-container/20 text-primary"
              }`}
            >
              {form.uploadStatus === "complete" ? (
                <span className="material-symbols-outlined text-lg">check</span>
              ) : form.uploadStatus === "error" ? (
                <span className="material-symbols-outlined text-lg">error</span>
              ) : (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-body-md text-white">
                {form.uploadStatus === "complete"
                  ? "Uploaded to Shelbynet"
                  : form.uploadStatus === "error"
                    ? "Upload failed"
                    : "Uploading to Shelbynet..."}
              </p>
              {form.uploadStatus === "complete" && form.manifestPath && (
                <p className="font-label-sm text-label-sm text-secondary-fixed break-all mt-1">{form.manifestPath}</p>
              )}
            </div>
          </div>
        )}
      </GlassPanel>

      {form.uploadError && (
        <div className="rounded-2xl bg-error-container/10 border border-error-container/30 p-4">
          <p className="text-error font-label-sm text-label-sm break-words">{form.uploadError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={form.uploadStatus === "uploading"}>
          Back
        </Button>
        {form.uploadStatus === "error" ? (
          <Button className="flex-1" size="lg" onClick={retry}>
            Retry
          </Button>
        ) : (
          <Button className="flex-1" size="lg" disabled={form.uploadStatus !== "complete"} onClick={onNext}>
            Continue to Pricing
          </Button>
        )}
      </div>
    </div>
  );
}
