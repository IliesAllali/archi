export default function ZoningForm({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
      </div>

      {/* Header */}
      <div className="text-center pt-8 pb-5 px-8">
        <div className="w-40 h-3.5 rounded bg-line-strong mx-auto mb-2.5" />
        <div className="w-32 h-1.5 rounded bg-bg-hover mx-auto" />
      </div>

      {/* Form container */}
      <div className="mx-6 rounded-xl border border-line bg-bg-surface p-5 mb-6">
        {/* Field 1 */}
        <div className="mb-4">
          <div className="w-12 h-1.5 rounded bg-line-strong mb-2" />
          <div className="h-8 rounded-md border border-line bg-bg-base flex items-center px-3">
            <div className="w-16 h-1.5 rounded bg-bg-hover" />
          </div>
        </div>

        {/* Field 2 */}
        <div className="mb-4">
          <div className="w-10 h-1.5 rounded bg-line-strong mb-2" />
          <div className="h-8 rounded-md border border-line bg-bg-base flex items-center px-3">
            <div className="w-20 h-1.5 rounded bg-bg-hover" />
          </div>
        </div>

        {/* Field 3 — textarea */}
        <div className="mb-5">
          <div className="w-14 h-1.5 rounded bg-line-strong mb-2" />
          <div className="h-14 rounded-md border border-line bg-bg-base p-3">
            <div className="w-full h-1 rounded bg-bg-hover mb-1.5" />
            <div className="w-3/4 h-1 rounded bg-bg-hover" />
          </div>
        </div>

        {/* Submit */}
        <div className="h-8 rounded-md flex items-center justify-center text-white text-[10px] font-medium" style={{ backgroundColor: accent }}>
          Envoyer
        </div>
      </div>
    </div>
  );
}
