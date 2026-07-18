interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ src, alt, size = 40, ring = false, className = "" }: AvatarProps) {
  const dimension = `${size}px`;
  return (
    <div
      className={`rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center shrink-0 ${
        ring ? "border-2 border-primary" : "border border-white/10"
      } ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant">person</span>
      )}
    </div>
  );
}
