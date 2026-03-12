export default function ZoningDetail({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Breadcrumb */}
      <rect x="16" y="48" width="32" height="6" rx="2" fill="#1F1F23" />
      <rect x="54" y="48" width="4" height="6" rx="1" fill="#2E2E35" />
      <rect x="64" y="48" width="48" height="6" rx="2" fill="#1F1F23" />
      <rect x="118" y="48" width="4" height="6" rx="1" fill="#2E2E35" />
      <rect x="128" y="48" width="64" height="6" rx="2" fill={accent} opacity="0.4" />

      {/* Hero media */}
      <rect x="16" y="68" width="308" height="110" rx="8" fill="#18181B" />
      <circle cx="170" cy="123" r="16" fill="#111113" stroke="#2E2E35" strokeWidth="1" />
      <polygon points="166,117 178,123 166,129" fill="#2E2E35" />

      {/* Title */}
      <rect x="16" y="194" width="200" height="14" rx="3" fill="#2E2E35" />
      <rect x="16" y="216" width="160" height="6" rx="2" fill="#1F1F23" />

      {/* KPI row */}
      <rect x="16" y="240" width="72" height="44" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="26" y="250" width="20" height="8" rx="2" fill={accent} opacity="0.5" />
      <rect x="26" y="264" width="40" height="5" rx="1" fill="#1F1F23" />

      <rect x="96" y="240" width="72" height="44" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="106" y="250" width="20" height="8" rx="2" fill={accent} opacity="0.5" />
      <rect x="106" y="264" width="40" height="5" rx="1" fill="#1F1F23" />

      <rect x="176" y="240" width="72" height="44" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="186" y="250" width="20" height="8" rx="2" fill={accent} opacity="0.5" />
      <rect x="186" y="264" width="40" height="5" rx="1" fill="#1F1F23" />

      <rect x="256" y="240" width="68" height="44" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="266" y="250" width="20" height="8" rx="2" fill={accent} opacity="0.5" />
      <rect x="266" y="264" width="40" height="5" rx="1" fill="#1F1F23" />

      {/* Content */}
      <rect x="16" y="300" width="220" height="6" rx="2" fill="#1F1F23" />
      <rect x="16" y="314" width="200" height="4" rx="1" fill="#161619" />
      <rect x="16" y="324" width="240" height="4" rx="1" fill="#161619" />
      <rect x="16" y="334" width="180" height="4" rx="1" fill="#161619" />
      <rect x="16" y="348" width="230" height="4" rx="1" fill="#161619" />
      <rect x="16" y="358" width="200" height="4" rx="1" fill="#161619" />
      <rect x="16" y="368" width="160" height="4" rx="1" fill="#161619" />

      {/* CTA */}
      <rect x="16" y="392" width="308" height="40" rx="8" fill={accent} opacity="0.12" stroke={accent} strokeWidth="1" strokeOpacity="0.2" />
      <rect x="120" y="406" width="100" height="10" rx="3" fill={accent} opacity="0.6" />

      {/* Related */}
      <rect x="16" y="452" width="96" height="6" rx="2" fill="#2E2E35" />
      <rect x="16" y="466" width="68" height="4" rx="1" fill="#1F1F23" />
    </svg>
  );
}
