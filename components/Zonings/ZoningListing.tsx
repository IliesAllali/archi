export default function ZoningListing({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="272" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Title */}
      <rect x="16" y="52" width="140" height="12" rx="3" fill="#2E2E35" />
      <rect x="16" y="72" width="200" height="6" rx="2" fill="#1F1F23" />

      {/* Filters */}
      <rect x="16" y="96" width="56" height="24" rx="12" fill={accent} opacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="80" y="96" width="48" height="24" rx="12" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="136" y="96" width="56" height="24" rx="12" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="200" y="96" width="44" height="24" rx="12" fill="#111113" stroke="#1F1F23" strokeWidth="1" />

      {/* Card grid — 3x3 */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const x = 16 + col * 106;
          const y = 136 + row * 108;
          return (
            <g key={`${row}-${col}`}>
              <rect x={x} y={y} width="98" height="96" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
              <rect x={x + 8} y={y + 8} width="82" height="36" rx="4" fill="#18181B" />
              <rect x={x + 8} y={y + 52} width="60" height="6" rx="2" fill="#2E2E35" />
              <rect x={x + 8} y={y + 64} width="74" height="4" rx="1" fill="#1F1F23" />
              <rect x={x + 8} y={y + 74} width="48" height="4" rx="1" fill="#1F1F23" />
            </g>
          );
        })
      )}

      {/* Pagination */}
      <rect x="130" y="468" width="8" height="8" rx="2" fill={accent} opacity="0.6" />
      <rect x="146" y="468" width="8" height="8" rx="2" fill="#1F1F23" />
      <rect x="162" y="468" width="8" height="8" rx="2" fill="#1F1F23" />
      <rect x="178" y="468" width="8" height="8" rx="2" fill="#1F1F23" />
    </svg>
  );
}
