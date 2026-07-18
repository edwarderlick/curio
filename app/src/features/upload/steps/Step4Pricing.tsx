import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ChainId } from "@/types";
import type { UploadFormState } from "../types";

interface StepProps {
  form: UploadFormState;
  setForm: (patch: Partial<UploadFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Pricing({ form, setForm, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <Input
        label="Price (USD)"
        type="number"
        min={0}
        step={0.5}
        value={form.priceUsd}
        onChange={(e) => setForm({ priceUsd: Number(e.target.value) })}
        icon={<span className="material-symbols-outlined text-lg">attach_money</span>}
      />
      <p className="font-label-sm text-label-sm text-on-surface-variant -mt-4">
        Stored chain-agnostic — buyers see this converted to APT/ETH/SOL at checkout using live rates.
      </p>
      <Select label="Primary chain tag" value={form.chain} onChange={(e) => setForm({ chain: e.target.value as ChainId })}>
        <option value="aptos">Aptos</option>
        <option value="ethereum">Ethereum</option>
        <option value="solana">Solana</option>
      </Select>
      <div className="rounded-2xl bg-surface-container-high p-4 flex items-center justify-between">
        <span className="text-on-surface-variant font-body-md">Storage duration</span>
        <span className="text-white font-bold">{form.storageDays} days</span>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" size="lg" onClick={onNext}>
          Review & Publish
        </Button>
      </div>
    </div>
  );
}
