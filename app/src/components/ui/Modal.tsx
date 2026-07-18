import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} glass-panel rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
