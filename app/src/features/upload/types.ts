import type { ChainId } from "@/types";
import type { JobState } from "@/lib/upload/uploadClient";

export interface UploadFormState {
  file: File | null;
  title: string;
  description: string;
  category: string;
  courseId: string;
  creatorName: string;
  creatorHandle: string;
  chain: ChainId;
  priceUsd: number;
  storageDays: number;
  jobId: string | null;
  job: JobState | null;
  manifestPath: string | null;
  publishedLectureId: string | null;
}

export const initialUploadForm: UploadFormState = {
  file: null,
  title: "",
  description: "",
  category: "Web3 Basics",
  courseId: "",
  creatorName: "",
  creatorHandle: "",
  chain: "aptos",
  priceUsd: 5,
  storageDays: 90,
  jobId: null,
  job: null,
  manifestPath: null,
  publishedLectureId: null,
};

export const CATEGORY_TONE: Record<string, "primary" | "secondary" | "tertiary" | "error" | "neutral"> = {
  "Web3 Basics": "primary",
  "Solana Ecosystem": "secondary",
  "Interface Design": "tertiary",
  "Risk Management": "error",
};
