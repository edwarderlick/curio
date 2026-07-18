import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-container text-on-primary-container font-bold hover:brightness-110 active:scale-[0.98]",
  secondary:
    "glass-panel text-on-surface border border-white/10 hover:border-primary/40 active:scale-[0.98]",
  ghost: "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
  danger: "bg-error text-on-error font-bold hover:brightness-110 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 rounded-xl text-sm gap-2",
  md: "px-6 py-3 rounded-xl text-body-md gap-2",
  lg: "px-8 py-4 rounded-2xl text-lg gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "right",
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-body-md transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...rest}
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
        ) : (
          <>
            {icon && iconPosition === "left" ? icon : null}
            {children}
            {icon && iconPosition === "right" ? icon : null}
          </>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
