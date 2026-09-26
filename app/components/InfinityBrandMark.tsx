import Image from "next/image";

interface InfinityBrandMarkProps {
  compact?: boolean;
  className?: string;
  size?: number;
}

export default function InfinityBrandMark({
  compact = false,
  className = "",
  size,
}: InfinityBrandMarkProps) {
  const pixelSize = size ?? (compact ? 34 : 44);

  return (
    <span
      className={`infinity-company-mark${compact ? " is-compact" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/infinity-admin-logo.png"
        alt="Infinity Company Logo"
        width={pixelSize}
        height={pixelSize}
        priority
        unoptimized
        className="infinity-brand-logo-img"
      />
    </span>
  );
}
