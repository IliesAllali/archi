export default function ZoningDetail({ accent }: { accent: string }) {
  return (
    <div className="w-full bg-bg-base text-label-primary select-none" style={{ fontSize: 0 }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-surface border-b border-line">
        <div className="w-10 h-2.5 rounded bg-line-strong" />
        <div className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center text-white" style={{ backgroundColor: accent }}>Contact</div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
        <div className="w-7 h-1.5 rounded bg-bg-hover" />
        <span className="text-[8px] text-label-faint">/</span>
        <div className="w-10 h-1.5 rounded bg-bg-hover" />
        <span className="text-[8px] text-label-faint">/</span>
        <div className="w-14 h-1.5 rounded" style={{ backgroundColor: `${accent}40` }} />
      </div>

      {/* Hero media */}
      <div className="mx-4 h-24 rounded-lg bg-bg-elevated flex items-center justify-center mb-3">
        <div className="w-8 h-8 rounded-full border border-line bg-bg-surface flex items-center justify-center">
          <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-transparent border-l-line-strong ml-0.5" />
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pb-3">
        <div className="w-40 h-3.5 rounded bg-line-strong mb-2" />
        <div className="w-32 h-1.5 rounded bg-bg-hover" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-1.5 px-4 pb-4">
        {["120+", "3 ans", "Bac", "CDI"].map((val) => (
          <div key={val} className="rounded-md border border-line bg-bg-surface p-2 text-center">
            <div className="text-[9px] font-semibold mb-0.5" style={{ color: accent }}>{val}</div>
            <div className="w-8 h-1 rounded bg-bg-hover mx-auto" />
          </div>
        ))}
      </div>

      {/* Content lines */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="w-full h-1.5 rounded bg-bg-hover" />
        <div className="w-11/12 h-1 rounded bg-bg-elevated" />
        <div className="w-full h-1 rounded bg-bg-elevated" />
        <div className="w-9/12 h-1 rounded bg-bg-elevated" />
        <div className="h-1" />
        <div className="w-full h-1 rounded bg-bg-elevated" />
        <div className="w-10/12 h-1 rounded bg-bg-elevated" />
        <div className="w-8/12 h-1 rounded bg-bg-elevated" />
      </div>

      {/* CTA */}
      <div className="mx-4 mb-3 rounded-lg border p-3 flex items-center justify-center" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}08` }}>
        <div className="h-2 w-20 rounded" style={{ backgroundColor: `${accent}70` }} />
      </div>

      {/* Related */}
      <div className="px-4 pb-4">
        <div className="w-16 h-1.5 rounded bg-line-strong mb-2" />
        <div className="w-14 h-1 rounded bg-bg-hover" />
      </div>
    </div>
  );
}
