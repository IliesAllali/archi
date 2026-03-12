export default function ZoningLanding({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="200" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="236" y="14" width="28" height="8" rx="2" fill="#1F1F23" />
      <rect x="280" y="11" width="44" height="14" rx="4" fill={accent} opacity="0.85" />

      {/* Hero */}
      <rect x="0" y="36" width="340" height="140" fill="#18181B" />
      <rect x="60" y="68" width="220" height="14" rx="3" fill="#2E2E35" />
      <rect x="80" y="92" width="180" height="6" rx="2" fill="#1F1F23" />
      <rect x="90" y="104" width="160" height="6" rx="2" fill="#1F1F23" />
      <rect x="115" y="128" width="56" height="26" rx="6" fill={accent} opacity="0.9" />
      <rect x="180" y="128" width="56" height="26" rx="6" fill="#1F1F23" stroke="#2E2E35" strokeWidth="1" />

      {/* Features 3col */}
      <rect x="120" y="196" width="100" height="8" rx="2" fill="#2E2E35" />

      <rect x="16" y="220" width="96" height="100" rx="8" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="64" cy="244" r="14" fill="#18181B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="36" y="268" width="56" height="6" rx="2" fill="#2E2E35" />
      <rect x="28" y="282" width="72" height="4" rx="1" fill="#1F1F23" />
      <rect x="32" y="292" width="64" height="4" rx="1" fill="#1F1F23" />

      <rect x="122" y="220" width="96" height="100" rx="8" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="170" cy="244" r="14" fill="#18181B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="142" y="268" width="56" height="6" rx="2" fill="#2E2E35" />
      <rect x="134" y="282" width="72" height="4" rx="1" fill="#1F1F23" />
      <rect x="138" y="292" width="64" height="4" rx="1" fill="#1F1F23" />

      <rect x="228" y="220" width="96" height="100" rx="8" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="276" cy="244" r="14" fill="#18181B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="248" y="268" width="56" height="6" rx="2" fill="#2E2E35" />
      <rect x="240" y="282" width="72" height="4" rx="1" fill="#1F1F23" />
      <rect x="244" y="292" width="64" height="4" rx="1" fill="#1F1F23" />

      {/* Social proof */}
      <rect x="16" y="340" width="308" height="60" rx="8" fill="#18181B" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="46" cy="370" r="14" fill="#111113" stroke="#1F1F23" strokeWidth="1" />
      <rect x="68" y="358" width="180" height="4" rx="1" fill="#1F1F23" />
      <rect x="68" y="368" width="140" height="4" rx="1" fill="#1F1F23" />
      <rect x="68" y="382" width="80" height="4" rx="1" fill="#2E2E35" />

      {/* Logos */}
      <rect x="40" y="420" width="40" height="16" rx="3" fill="#1F1F23" />
      <rect x="96" y="420" width="40" height="16" rx="3" fill="#1F1F23" />
      <rect x="150" y="420" width="40" height="16" rx="3" fill="#1F1F23" />
      <rect x="206" y="420" width="40" height="16" rx="3" fill="#1F1F23" />
      <rect x="260" y="420" width="40" height="16" rx="3" fill="#1F1F23" />

      {/* Final CTA */}
      <rect x="16" y="456" width="308" height="48" rx="10" fill={accent} opacity="0.1" stroke={accent} strokeWidth="1" strokeOpacity="0.2" />
      <rect x="100" y="470" width="80" height="8" rx="2" fill="#2E2E35" />
      <rect x="190" y="468" width="56" height="24" rx="6" fill={accent} opacity="0.7" />
    </svg>
  );
}
