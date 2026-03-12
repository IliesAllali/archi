export default function ZoningHome({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative px-8 py-12 bg-bg-elevated text-center">
        <div className="w-44 h-3 rounded bg-line-strong mx-auto mb-3" />
        <div className="w-28 h-2 rounded bg-bg-hover mx-auto mb-5" />
        <div className="flex items-center justify-center gap-2">
          <div className="h-6 px-4 rounded-md text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>Explorer</div>
          <div className="h-6 px-4 rounded-md text-[9px] font-medium flex items-center border border-line text-label-muted bg-bg-base">Formation</div>
        </div>
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        {["120+", "15k", "94%"].map((val) => (
          <div key={val} className="rounded-md border border-line bg-bg-surface p-3 text-center">
            <div className="text-[11px] font-semibold mb-1" style={{ color: accent }}>{val}</div>
            <div className="w-10 h-1.5 rounded bg-bg-hover mx-auto" />
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="px-4 pt-2 pb-3">
        <div className="w-24 h-2 rounded bg-line-strong mx-auto" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-md border border-line bg-bg-surface overflow-hidden">
            <div className="h-8 bg-bg-elevated" />
            <div className="p-2">
              <div className="w-12 h-1.5 rounded bg-line-strong mb-1.5" />
              <div className="w-16 h-1 rounded bg-bg-hover mb-1" />
              <div className="w-12 h-1 rounded bg-bg-hover mb-2" />
              <div className="w-8 h-3 rounded text-[7px] flex items-center justify-center text-white" style={{ backgroundColor: accent, opacity: 0.7 }}>→</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz teaser */}
      <div className="mx-4 mb-4 rounded-lg border border-line bg-bg-elevated p-4 flex items-center justify-between">
        <div>
          <div className="w-28 h-2 rounded bg-line-strong mb-2" />
          <div className="w-20 h-1.5 rounded bg-bg-hover" />
        </div>
        <div className="h-6 px-3 rounded-md text-[8px] font-medium flex items-center text-white shrink-0" style={{ backgroundColor: accent, opacity: 0.85 }}>Quiz →</div>
      </div>
    </div>
  );
}
