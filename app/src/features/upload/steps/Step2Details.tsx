import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  setForm: (patch: Partial<UploadFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORIES = ["Web3 Basics", "Solana Ecosystem", "Interface Design", "Risk Management"];

export function Step2Details({ form, setForm, onNext, onBack }: StepProps) {
  const valid = form.title.trim() && form.courseId.trim() && form.creatorName.trim() && form.creatorHandle.trim();

  return (
    <div className="space-y-6">
      <Input label="Lecture title" value={form.title} onChange={(e) => setForm({ title: e.target.value })} placeholder="Advanced Solana Program Architecture" />
      <TextArea
        label="Description"
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ description: e.target.value })}
        placeholder="What will learners walk away knowing?"
      />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" value={form.category} onChange={(e) => setForm({ category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Input
          label="Course grouping"
          value={form.courseId}
          onChange={(e) => setForm({ courseId: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })}
          placeholder="solana-architecture"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Creator name" value={form.creatorName} onChange={(e) => setForm({ creatorName: e.target.value })} placeholder="Your name" />
        <Input label="Creator handle" value={form.creatorHandle} onChange={(e) => setForm({ creatorHandle: e.target.value })} placeholder="@you" />
      </div>
      <Select
        label="Storage duration"
        value={String(form.storageDays)}
        onChange={(e) => setForm({ storageDays: Number(e.target.value) })}
      >
        <option value="30">30 days</option>
        <option value="90">90 days</option>
        <option value="365">1 year</option>
      </Select>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" size="lg" disabled={!valid} onClick={onNext}>
          Continue to Processing
        </Button>
      </div>
    </div>
  );
}
