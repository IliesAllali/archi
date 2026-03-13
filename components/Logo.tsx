export default function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Geometric tree/node icon — three connected diamonds */}
      <path
        d="M12 2L16 6L12 10L8 6L12 2Z"
        fill="var(--text-primary)"
      />
      <path
        d="M5 11L9 15L5 19L1 15L5 11Z"
        fill="var(--text-primary)"
        opacity="0.6"
      />
      <path
        d="M19 11L23 15L19 19L15 15L19 11Z"
        fill="var(--text-primary)"
        opacity="0.6"
      />
      {/* Connection lines */}
      <line x1="9.5" y1="7.5" x2="6.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
      <line x1="14.5" y1="7.5" x2="17.5" y2="12.5" stroke="var(--text-primary)" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}
