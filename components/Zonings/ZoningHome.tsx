export default function ZoningHome({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="200" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="236" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="272" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Hero */}
      <rect x="0" y="36" width="340" height="160" fill="#18181B" />
      <rect x="40" y="70" width="180" height="12" rx="3" fill="#2E2E35" />
      <rect x="70" y="90" width="120" height="8" rx="2" fill="#1F1F23" />
      <rect x="105" y="115" width="56" height="24" rx="6" fill={accent} opacity="0.9" />
      <rect x="170" y="115" width="65" height="24" rx="6" fill="#1F1F23" stroke="#2E2E35" strokeWidth="1" />

      {/* Key figures */}
      <rect x="16" y="212" width="96" height="48" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="32" y="224" width="24" height="10" rx="2" fill={accent} opacity="0.4" />
      <rect x="32" y="240" width="48" height="6" rx="2" fill="#1F1F23" />
      <rect x="122" y="212" width="96" height="48" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="138" y="224" width="24" height="10" rx="2" fill={accent} opacity="0.4" />
      <rect x="138" y="240" width="48" height="6" rx="2" fill="#1F1F23" />
      <rect x="228" y="212" width="96" height="48" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="244" y="224" width="24" height="10" rx="2" fill={accent} opacity="0.4" />
      <rect x="244" y="240" width="48" height="6" rx="2" fill="#1F1F23" />

      {/* Section title */}
      <rect x="110" y="280" width="120" height="8" rx="2" fill="#2E2E35" />

      {/* Cards grid */}
      <rect x="16" y="300" width="96" height="72" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="24" y="308" width="60" height="6" rx="2" fill="#2E2E35" />
      <rect x="24" y="320" width="80" height="4" rx="1" fill="#1F1F23" />
      <rect x="24" y="328" width="64" height="4" rx="1" fill="#1F1F23" />
      <rect x="24" y="352" width="36" height="12" rx="3" fill={accent} opacity="0.3" />

      <rect x="122" y="300" width="96" height="72" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="130" y="308" width="60" height="6" rx="2" fill="#2E2E35" />
      <rect x="130" y="320" width="80" height="4" rx="1" fill="#1F1F23" />
      <rect x="130" y="328" width="64" height="4" rx="1" fill="#1F1F23" />
      <rect x="130" y="352" width="36" height="12" rx="3" fill={accent} opacity="0.3" />

      <rect x="228" y="300" width="96" height="72" rx="6" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="236" y="308" width="60" height="6" rx="2" fill="#2E2E35" />
      <rect x="236" y="320" width="80" height="4" rx="1" fill="#1F1F23" />
      <rect x="236" y="328" width="64" height="4" rx="1" fill="#1F1F23" />
      <rect x="236" y="352" width="36" height="12" rx="3" fill={accent} opacity="0.3" />

      {/* Quiz teaser */}
      <rect x="16" y="392" width="308" height="64" rx="8" fill="#18181B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="32" y="408" width="140" height="8" rx="2" fill="#2E2E35" />
      <rect x="32" y="422" width="100" height="6" rx="2" fill="#1F1F23" />
      <rect x="248" y="412" width="56" height="24" rx="6" fill={accent} opacity="0.7" />
    </svg>
  );
}
