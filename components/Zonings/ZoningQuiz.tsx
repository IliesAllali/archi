export default function ZoningQuiz({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-5 pb-2 flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-bg-hover overflow-hidden">
          <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: accent, opacity: 0.8 }} />
        </div>
        <span className="text-[9px] text-label-muted font-medium">3/6</span>
      </div>

      {/* Step label */}
      <div className="text-center pb-3">
        <div className="w-14 h-1.5 rounded bg-line-strong mx-auto" />
      </div>

      {/* Question card */}
      <div className="mx-4 rounded-xl border border-line bg-bg-surface p-5">
        {/* Question */}
        <div className="text-center mb-5">
          <div className="w-44 h-2.5 rounded bg-line-strong mx-auto mb-2" />
          <div className="w-36 h-1.5 rounded bg-bg-hover mx-auto" />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-line bg-bg-base">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-line-strong shrink-0" />
            <div className="w-24 h-1.5 rounded bg-bg-hover" />
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}>
            <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center" style={{ borderColor: accent }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            </div>
            <div className="w-28 h-1.5 rounded bg-line-strong" />
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-line bg-bg-base">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-line-strong shrink-0" />
            <div className="w-20 h-1.5 rounded bg-bg-hover" />
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-line bg-bg-base">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-line-strong shrink-0" />
            <div className="w-26 h-1.5 rounded bg-bg-hover" />
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2 px-4 pt-4 pb-5">
        <div className="flex-1 h-8 rounded-md border border-line bg-bg-surface flex items-center justify-center">
          <div className="w-12 h-1.5 rounded bg-bg-hover" />
        </div>
        <div className="flex-1 h-8 rounded-md flex items-center justify-center text-white text-[9px] font-medium" style={{ backgroundColor: accent }}>
          Suivant →
        </div>
      </div>
    </div>
  );
}
