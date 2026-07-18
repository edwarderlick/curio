import type { HTMLAttributes } from "react";

type Tone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-container/20 text-primary-fixed",
  secondary: "bg-secondary-container/20 text-secondary-fixed",
  tertiary: "bg-tertiary-container/20 text-tertiary",
  neutral: "bg-surface-container-high text-on-surface-variant border border-outline-variant/20",
  error: "bg-error-container/20 text-error",
};

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Category tag / status pill — curio_system/DESIGN.md "Chips / Chain Labels" */
export function Chip({ tone = "neutral", className = "", children, ...rest }: ChipProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider inline-flex items-center gap-1 ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export type ChainId = "aptos" | "ethereum" | "solana";

const chainMeta: Record<ChainId, { label: string; tone: Tone; icon: string }> = {
  // DESIGN.md: green reserved for Aptos chain status, purple for Ethereum/Solana identifiers
  aptos: { label: "Aptos", tone: "secondary", icon: "token" },
  ethereum: { label: "Ethereum", tone: "tertiary", icon: "hexagon" },
  solana: { label: "Solana", tone: "tertiary", icon: "bolt" },
};

export function ChainBadge({ chain, className = "" }: { chain: ChainId; className?: string }) {
  const meta = chainMeta[chain];
  return (
    <span
      className={`px-3 py-1 rounded-full font-label-sm text-label-sm inline-flex items-center gap-1.5 border ${
        meta.tone === "secondary"
          ? "bg-secondary-container/10 border-secondary-container/30 text-secondary-fixed"
          : "bg-tertiary-container/10 border-tertiary-container/30 text-tertiary"
      } ${className}`}
    >
      <span className="material-symbols-outlined text-sm">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
