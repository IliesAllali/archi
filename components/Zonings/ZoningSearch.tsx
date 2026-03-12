export default function ZoningSearch({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
      </div>

      {/* Search bar */}
      <div className="mx-4 mt-5 mb-3">
        <div className="flex items-center h-9 rounded-lg border border-line bg-bg-surface px-3 gap-2">
          <svg className="w-3.5 h-3.5 text-label-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <div className="w-16 h-1.5 rounded bg-bg-hover" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-4 pb-4">
        <div className="h-5 px-2.5 rounded-full text-[8px] font-medium flex items-center border" style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}12` }}>Actif</div>
        <div className="h-5 px-2.5 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Métier</div>
        <div className="h-5 px-2.5 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Formation</div>
        <div className="h-5 px-2.5 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Région</div>
      </div>

      {/* Result count */}
      <div className="px-4 pb-2">
        <div className="w-16 h-1.5 rounded bg-line-strong" />
      </div>

      {/* Results */}
      <div className="px-4 pb-4 space-y-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-line bg-bg-surface">
            <div className="flex-1 min-w-0">
              <div className="w-24 h-1.5 rounded bg-line-strong mb-1.5" />
              <div className="w-40 h-1 rounded bg-bg-hover" />
            </div>
            <div
              className="h-4 px-2 rounded text-[7px] font-medium flex items-center shrink-0"
              style={{ backgroundColor: `${accent}${i === 1 ? '30' : '15'}`, color: accent }}
            >
              →
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="text-center pb-4">
        <div className="w-20 h-2 rounded bg-bg-hover mx-auto" />
      </div>
    </div>
  );
}
