import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
}

const fieldBase =
  "w-full bg-surface-container-high border border-white/5 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 py-3 px-4 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 transition-all";

export const Input = forwardRef<HTMLInputElement, InputProps>(({ icon, label, className = "", ...rest }, ref) => (
  <label className="block">
    {label && <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{label}</span>}
    <span className="relative block">
      {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">{icon}</span>}
      <input ref={ref} className={`${fieldBase} ${icon ? "pl-12" : ""} ${className}`} {...rest} />
    </span>
  </label>
));
Input.displayName = "Input";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ label, className = "", ...rest }, ref) => (
    <label className="block">
      {label && <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{label}</span>}
      <textarea ref={ref} className={`${fieldBase} resize-none ${className}`} {...rest} />
    </label>
  ),
);
TextArea.displayName = "TextArea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ label, className = "", children, ...rest }, ref) => (
    <label className="block">
      {label && <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{label}</span>}
      <select ref={ref} className={`${fieldBase} ${className}`} {...rest}>
        {children}
      </select>
    </label>
  ),
);
Select.displayName = "Select";
