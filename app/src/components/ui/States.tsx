import type { ReactNode } from "react";
import { Button } from "./Button";

interface StateProps {
  title: string;
  description?: string;
  className?: string;
}

export function LoadingState({ title = "Loading", description, className = "" }: Partial<StateProps>) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-20 gap-4 ${className}`}>
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      <div>
        <p className="font-headline-md text-headline-md text-white">{title}</p>
        {description && <p className="text-on-surface-variant font-body-md mt-1">{description}</p>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  action,
  className = "",
}: StateProps & { icon?: string; action?: ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-20 gap-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div>
        <p className="font-headline-md text-headline-md text-white">{title}</p>
        {description && <p className="text-on-surface-variant font-body-md mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className = "",
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-20 gap-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-error-container/10 flex items-center justify-center text-error">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <div>
        <p className="font-headline-md text-headline-md text-white">{title}</p>
        {description && <p className="text-on-surface-variant font-body-md mt-1 max-w-sm">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<span className="material-symbols-outlined text-lg">refresh</span>} iconPosition="left">
          Retry
        </Button>
      )}
    </div>
  );
}
