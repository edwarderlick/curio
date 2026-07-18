import { useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import type { UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  setForm: (patch: Partial<UploadFormState>) => void;
  onNext: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Step1Upload({ form, setForm, onNext }: StepProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && file.type.startsWith("video/")) setForm({ file });
  }

  return (
    <div className="space-y-6">
      <GlassPanel
        className={`p-16 flex flex-col items-center justify-center text-center border-2 border-dashed transition-colors cursor-pointer ${
          dragging ? "border-primary bg-primary/5" : "border-white/10"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="material-symbols-outlined text-5xl text-primary mb-4">upload_file</span>
        {form.file ? (
          <>
            <p className="font-bold text-white">{form.file.name}</p>
            <p className="text-on-surface-variant font-label-sm text-label-sm mt-1">{formatBytes(form.file.size)}</p>
          </>
        ) : (
          <>
            <p className="font-headline-md text-headline-md text-white mb-2">Drag & drop your video</p>
            <p className="text-on-surface-variant font-body-md">or click to browse — MP4, MOV, WebM</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </GlassPanel>
      <Button className="w-full" size="lg" disabled={!form.file} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
