export default function ZoningSearch({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Search bar */}
      <rect x="30" y="56" width="280" height="36" rx="8" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="52" cy="74" r="7" fill="none" stroke="#2E2E35" strokeWidth="1.5" />
      <line x1="57" y1="79" x2="61" y2="83" stroke="#2E2E35" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="70" y="70" width="80" height="6" rx="2" fill="#1F1F23" />

      {/* Filter chips */}
      <rect x="30" y="104" width="52" height="22" rx="11" fill={accent} opacity="0.12" stroke={accent} strokeWidth="1" strokeOpacity="0.25" />
      <rect x="90" y="104" width="44" height="22" rx="11" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="142" y="104" width="56" height="22" rx="11" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="206" y="104" width="48" height="22" rx="11" fill="#111113" stroke="#1F1F23" strokeWidth="1" />

      {/* Result count */}
      <rect x="30" y="140" width="80" height="6" rx="2" fill="#2E2E35" />

      {/* Results */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 160 + i * 48;
        return (
          <g key={i}>
            <rect x="30" y={y} width="280" height="40" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
            <rect x="46" y={y + 10} width="120" height="6" rx="2" fill="#2E2E35" />
            <rect x="46" y={y + 22} width="200" height="4" rx="1" fill="#1F1F23" />
            <rect x="270" y={y + 12} width="24" height="16" rx="4" fill={accent} opacity={i === 0 ? "0.3" : "0.12"} />
          </g>
        );
      })}

      {/* Load more */}
      <rect x="120" y="404" width="100" height="8" rx="2" fill="#1F1F23" />
    </svg>
  );
}
