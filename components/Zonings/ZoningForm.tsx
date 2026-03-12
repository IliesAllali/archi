export default function ZoningForm({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Navbar */}
      <rect x="0" y="0" width="340" height="36" fill="#111113" />
      <rect x="16" y="13" width="40" height="10" rx="2" fill="#2E2E35" />
      <rect x="308" y="12" width="16" height="12" rx="3" fill={accent} opacity="0.8" />

      {/* Title */}
      <rect x="70" y="64" width="200" height="14" rx="3" fill="#2E2E35" />
      <rect x="90" y="86" width="160" height="6" rx="2" fill="#1F1F23" />

      {/* Form container */}
      <rect x="50" y="112" width="240" height="272" rx="10" fill="#111113" stroke="#1F1F23" strokeWidth="1" />

      {/* Field 1 */}
      <rect x="70" y="132" width="60" height="6" rx="2" fill="#2E2E35" />
      <rect x="70" y="146" width="200" height="32" rx="6" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="82" y="158" width="80" height="6" rx="2" fill="#1F1F23" />

      {/* Field 2 */}
      <rect x="70" y="196" width="48" height="6" rx="2" fill="#2E2E35" />
      <rect x="70" y="210" width="200" height="32" rx="6" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="82" y="222" width="100" height="6" rx="2" fill="#1F1F23" />

      {/* Field 3 — textarea */}
      <rect x="70" y="260" width="56" height="6" rx="2" fill="#2E2E35" />
      <rect x="70" y="274" width="200" height="56" rx="6" fill="#0A0A0B" stroke="#1F1F23" strokeWidth="1" />
      <rect x="82" y="286" width="160" height="4" rx="1" fill="#1F1F23" />
      <rect x="82" y="296" width="120" height="4" rx="1" fill="#1F1F23" />

      {/* Submit */}
      <rect x="70" y="348" width="200" height="32" rx="6" fill={accent} opacity="0.85" />
      <rect x="140" y="360" width="60" height="8" rx="2" fill="#EDEDEF" opacity="0.9" />
    </svg>
  );
}
