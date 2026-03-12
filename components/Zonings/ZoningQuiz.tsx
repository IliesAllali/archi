export default function ZoningQuiz({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Progress bar */}
      <rect x="40" y="56" width="260" height="4" rx="2" fill="#1F1F23" />
      <rect x="40" y="56" width="130" height="4" rx="2" fill={accent} opacity="0.7" />
      <rect x="280" y="48" width="20" height="8" rx="2" fill="#1F1F23" />

      {/* Step label */}
      <rect x="140" y="72" width="60" height="6" rx="2" fill="#2E2E35" />

      {/* Question card */}
      <rect x="30" y="96" width="280" height="280" rx="12" fill="#111113" stroke="#1F1F23" strokeWidth="1" />

      {/* Question */}
      <rect x="60" y="124" width="220" height="10" rx="3" fill="#2E2E35" />
      <rect x="80" y="142" width="180" height="6" rx="2" fill="#1F1F23" />

      {/* Options */}
      <rect x="54" y="172" width="232" height="36" rx="8" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="74" cy="190" r="6" fill="none" stroke="#2E2E35" strokeWidth="1.5" />
      <rect x="90" y="186" width="120" height="6" rx="2" fill="#1F1F23" />

      <rect x="54" y="218" width="232" height="36" rx="8" fill={accent} opacity="0.08" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="74" cy="236" r="6" fill={accent} opacity="0.6" />
      <circle cx="74" cy="236" r="3" fill={accent} />
      <rect x="90" y="232" width="140" height="6" rx="2" fill="#2E2E35" />

      <rect x="54" y="264" width="232" height="36" rx="8" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="74" cy="282" r="6" fill="none" stroke="#2E2E35" strokeWidth="1.5" />
      <rect x="90" y="278" width="100" height="6" rx="2" fill="#1F1F23" />

      <rect x="54" y="310" width="232" height="36" rx="8" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <circle cx="74" cy="328" r="6" fill="none" stroke="#2E2E35" strokeWidth="1.5" />
      <rect x="90" y="324" width="130" height="6" rx="2" fill="#1F1F23" />

      {/* Nav buttons */}
      <rect x="30" y="392" width="130" height="28" rx="6" fill="#1F1F23" stroke="#2E2E35" strokeWidth="1" />
      <rect x="180" y="392" width="130" height="28" rx="6" fill={accent} opacity="0.85" />
    </svg>
  );
}
