import { API_BASE_URL } from "@/lib/apiBase";

export type JobStage = "uploading_source" | "transcoding" | "uploading_segments" | "complete" | "error";

export interface JobState {
  id: string;
  stage: JobStage;
  message?: string;
  progress?: { current: number; total: number };
  error?: string;
  manifestPath?: string;
}

export async function startUploadJob(params: {
  file: File;
  courseId: string;
  lectureId: string;
  expirationMicros: number;
}): Promise<string> {
  const form = new FormData();
  form.append("video", params.file);
  form.append("courseId", params.courseId);
  form.append("lectureId", params.lectureId);
  form.append("expirationMicros", String(params.expirationMicros));

  const res = await fetch(`${API_BASE_URL}/api/upload/start`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed to start: ${res.status}`);
  }
  const data: { jobId: string } = await res.json();
  return data.jobId;
}

/** Subscribes to real SSE progress from the transcode/upload pipeline. */
export function subscribeToJob(jobId: string, onUpdate: (job: JobState) => void): () => void {
  const source = new EventSource(`${API_BASE_URL}/api/upload/${jobId}/events`);
  source.onmessage = (event) => {
    const job: JobState = JSON.parse(event.data);
    onUpdate(job);
    if (job.stage === "complete" || job.stage === "error") source.close();
  };
  source.onerror = () => {
    onUpdate({ id: jobId, stage: "error", error: "Lost connection to the upload pipeline." });
    source.close();
  };
  return () => source.close();
}
