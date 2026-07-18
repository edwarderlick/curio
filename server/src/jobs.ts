import { EventEmitter } from "node:events";

export type JobStage = "uploading_source" | "transcoding" | "uploading_segments" | "complete" | "error";

export interface JobState {
  id: string;
  stage: JobStage;
  message?: string;
  progress?: { current: number; total: number };
  error?: string;
  manifestPath?: string;
}

class JobBus extends EventEmitter {
  private jobs = new Map<string, JobState>();

  create(id: string): JobState {
    const job: JobState = { id, stage: "uploading_source" };
    this.jobs.set(id, job);
    return job;
  }

  update(id: string, patch: Partial<JobState>) {
    const job = this.jobs.get(id);
    if (!job) return;
    Object.assign(job, patch);
    this.emit(id, job);
  }

  get(id: string): JobState | undefined {
    return this.jobs.get(id);
  }
}

export const jobBus = new JobBus();
