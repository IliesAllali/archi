export default function ZoningListing({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-2 rounded bg-bg-hover" />
          <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>CTA</div>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="w-32 h-3 rounded bg-line-strong mb-2" />
        <div className="w-44 h-1.5 rounded bg-bg-hover" />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 px-4 pb-4">
        <div className="h-6 px-3 rounded-full text-[8px] font-medium flex items-center border" style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>Tous</div>
        <div className="h-6 px-3 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Réseaux</div>
        <div className="h-6 px-3 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Bâtiment</div>
        <div className="h-6 px-3 rounded-full text-[8px] font-medium flex items-center border border-line text-label-muted bg-bg-surface">Industrie</div>
      </div>

      {/* Card grid 3x3 */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-md border border-line bg-bg-surface overflow-hidden group">
            <div className="h-8 bg-bg-elevated" />
            <div className="p-2">
              <div className="w-12 h-1.5 rounded bg-line-strong mb-1.5" />
              <div className="w-16 h-1 rounded bg-bg-hover mb-1" />
              <div className="w-10 h-1 rounded bg-bg-hover" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1.5 pb-4">
        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: accent, opacity: 0.7 }} />
        <div className="w-2 h-2 rounded-sm bg-bg-hover" />
        <div className="w-2 h-2 rounded-sm bg-bg-hover" />
        <div className="w-2 h-2 rounded-sm bg-bg-hover" />
      </div>
    </div>
  );
}
