export default function ZoningLanding({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
        </div>
      </div>

      {/* Hero */}
      <div className="px-8 py-10 bg-bg-elevated text-center">
        <div className="w-44 h-3.5 rounded bg-line-strong mx-auto mb-3" />
        <div className="w-36 h-1.5 rounded bg-bg-hover mx-auto mb-2" />
        <div className="w-32 h-1.5 rounded bg-bg-hover mx-auto mb-5" />
        <div className="flex items-center justify-center gap-2">
          <div className="h-7 px-5 rounded-md text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>Commencer</div>
          <div className="h-7 px-5 rounded-md text-[9px] font-medium flex items-center border border-line text-label-muted bg-bg-base">En savoir +</div>
        </div>
      </div>

      {/* Section title */}
      <div className="text-center pt-5 pb-4">
        <div className="w-20 h-2 rounded bg-line-strong mx-auto" />
      </div>

      {/* Features 3col */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-line bg-bg-surface p-3 text-center">
            <div className="w-7 h-7 rounded-full border border-line bg-bg-elevated mx-auto mb-2" />
            <div className="w-12 h-1.5 rounded bg-line-strong mx-auto mb-1.5" />
            <div className="w-16 h-1 rounded bg-bg-hover mx-auto mb-1" />
            <div className="w-14 h-1 rounded bg-bg-hover mx-auto" />
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="mx-4 mb-4 rounded-lg border border-line bg-bg-elevated p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full border border-line bg-bg-surface shrink-0" />
        <div className="flex-1">
          <div className="w-full h-1 rounded bg-bg-hover mb-1.5" />
          <div className="w-4/5 h-1 rounded bg-bg-hover mb-2" />
          <div className="w-16 h-1 rounded bg-line-strong" />
        </div>
      </div>

      {/* Logos */}
      <div className="flex items-center justify-center gap-3 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-9 h-4 rounded bg-bg-hover" />
        ))}
      </div>

      {/* Final CTA */}
      <div className="mx-4 mb-4 rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: `${accent}25`, backgroundColor: `${accent}08` }}>
        <div>
          <div className="w-16 h-2 rounded bg-line-strong mb-1.5" />
        </div>
        <div className="h-6 px-4 rounded-md text-[8px] font-medium flex items-center text-white shrink-0" style={{ backgroundColor: accent, opacity: 0.85 }}>Démarrer</div>
      </div>
    </div>
  );
}
