export default function InfinityBrandMark({ compact = false }: { compact?: boolean }) {
  return <span className={`infinity-company-mark${compact ? " is-compact" : ""}`} aria-hidden="true">∞</span>;
}
