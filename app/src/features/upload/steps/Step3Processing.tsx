import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { startUploadJob, subscribeToJob, type JobStage } from "@/lib/upload/uploadClient";
import type { UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  setForm: (patch: Partial<UploadFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const STAGE_ORDER: JobStage[] = ["uploading_source", "transcoding", "uploading_segments", "complete"];
const STAGE_LABEL: Record<JobStage, string> = {
  uploading_source: "Uploading source file",
  transcoding: "Transcoding to multi-bitrate HLS",
  uploading_segments: "Registering & uploading segments to Shelbynet",
  complete: "Published to Shelbynet",
  error: "Failed",
};

export function Step3Processing({ form, setForm, onNext, onBack }: StepProps) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !form.file) return;
    started.current = true;

    const lectureId = crypto.randomUUID();
    const expirationMicros = Date.now() * 1000 + form.storageDays * 86_400 * 1_000_000;

    (async () => {
      try {
        const jobId = await startUploadJob({ file: form.file as File, courseId: form.courseId, lectureId, expirationMicros });
        setForm({ jobId });
        subscribeToJob(jobId, (job) => {
          setForm({ job });
          if (job.stage === "error") setError(job.error ?? "Upload failed");
          if (job.stage === "complete" && job.manifestPath) {
            setForm({ manifestPath: job.manifestPath });
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    started.current = false;
    setError(null);
    setForm({ job: null, jobId: null, manifestPath: null });
  }

  const currentStageIndex = form.job ? STAGE_ORDER.indexOf(form.job.stage) : -1;

  return (
    <div className="space-y-6">
      <GlassPanel className="p-8 space-y-5">
        {STAGE_ORDER.map((stage, i) => {
          const done = currentStageIndex > i || (stage === "complete" && form.job?.stage === "complete");
          const active = currentStageIndex === i && form.job?.stage !== "error";
          return (
            <div key={stage} className="flex items-center gap-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-secondary-container/20 text-secondary-fixed" : active ? "bg-primary-container/20 text-primary" : "bg-white/5 text-on-surface-variant"
                }`}
              >
                {done ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : active ? (
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                ) : (
                  <span className="text-xs font-label-sm">{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-body-md ${done || active ? "text-white" : "text-on-surface-variant"}`}>{STAGE_LABEL[stage]}</p>
                {active && stage === "uploading_segments" && form.job?.progress && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-container transition-all"
                        style={{ width: `${(form.job.progress.current / Math.max(form.job.progress.total, 1)) * 100}%` }}
                      />
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{form.job.message}</p>
                  </div>
                )}
                {active && stage !== "uploading_segments" && form.job?.message && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{form.job.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </GlassPanel>

      {error && (
        <div className="rounded-2xl bg-error-container/10 border border-error-container/30 p-4">
          <p className="text-error font-label-sm text-label-sm break-words">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={Boolean(form.job && form.job.stage !== "error")}>
          Back
        </Button>
        {error ? (
          <Button className="flex-1" size="lg" onClick={retry}>
            Retry
          </Button>
        ) : (
          <Button className="flex-1" size="lg" disabled={form.job?.stage !== "complete"} onClick={onNext}>
            Continue to Pricing
          </Button>
        )}
      </div>
    </div>
  );
}
