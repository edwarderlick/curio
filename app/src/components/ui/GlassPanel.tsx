import type { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
}

/** Shared card/panel surface — see curio_system/DESIGN.md "Elevation & Depth" */
export function GlassPanel({ hoverGlow = false, className = "", children, ...rest }: GlassPanelProps) {
  return (
    <div
      className={`glass-panel rounded-3xl ${hoverGlow ? "transition-all hover:border-primary/50" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
