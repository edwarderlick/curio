import { useState } from "react";
import { Step1Upload } from "./steps/Step1Upload";
import { Step2Details } from "./steps/Step2Details";
import { Step3Processing } from "./steps/Step3Processing";
import { Step4Pricing } from "./steps/Step4Pricing";
import { Step5Review } from "./steps/Step5Review";
import { initialUploadForm, type UploadFormState } from "./types";

const STEPS = ["Upload", "Details", "Processing", "Pricing & Storage", "Review & Publish"];

export function UploadWizard() {
  const [step, setStep] = useState(0);
  const [form, setFormState] = useState<UploadFormState>(initialUploadForm);

  function setForm(patch: Partial<UploadFormState>) {
    setFormState((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="font-headline-lg text-headline-lg text-white mb-2">Upload New Lecture</h1>
      <p className="text-on-surface-variant font-body-md mb-8">Real transcode, real Shelbynet blob storage — no simulated steps.</p>

      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i < step ? "bg-secondary-container/20 text-secondary-fixed" : i === step ? "bg-primary-container text-on-primary-container" : "bg-white/5 text-on-surface-variant"
              }`}
            >
              {i < step ? <span className="material-symbols-outlined text-base">check</span> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-secondary-container/40" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {step === 0 && <Step1Upload form={form} setForm={setForm} onNext={() => setStep(1)} />}
      {step === 1 && <Step2Details form={form} setForm={setForm} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <Step3Processing form={form} setForm={setForm} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step4Pricing form={form} setForm={setForm} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step5Review form={form} onBack={() => setStep(3)} />}
    </div>
  );
}
