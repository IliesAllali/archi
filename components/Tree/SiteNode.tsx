"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { SiteNode, ZoningType } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Mini block zoning per page type ─── */
function MiniZoning({ type }: { type: ZoningType }) {
  const bar = "w-full h-[3px] rounded-[1px] bg-white/20";
  const block = "rounded-[1px] bg-white/[0.07]";
  const blockLight = "rounded-[1px] bg-white/[0.12]";

  switch (type) {
    case "home":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(blockLight, "w-full h-[22px]")} />
          <div className="flex gap-[3px] flex-1">
            <div className={cn(block, "flex-1")} />
            <div className={cn(block, "flex-1")} />
            <div className={cn(block, "flex-1")} />
          </div>
          <div className={cn(block, "w-full h-[6px]")} />
        </div>
      );
    case "listing":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(blockLight, "w-2/3 h-[4px]")} />
          <div className="flex flex-col gap-[2px] flex-1">
            <div className={cn(block, "w-full h-[8px]")} />
            <div className={cn(block, "w-full h-[8px]")} />
            <div className={cn(block, "w-full h-[8px]")} />
          </div>
        </div>
      );
    case "detail":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className="flex gap-[3px] flex-1">
            <div className="flex flex-col gap-[2px] flex-[2]">
              <div className={cn(blockLight, "w-full h-[5px]")} />
              <div className={cn(block, "w-full flex-1")} />
            </div>
            <div className={cn(block, "flex-1")} />
          </div>
          <div className={cn(block, "w-full h-[6px]")} />
        </div>
      );
    case "form":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className="flex flex-col gap-[2px] flex-1 items-center justify-center px-[6px]">
            <div className={cn(block, "w-full h-[5px]")} />
            <div className={cn(block, "w-full h-[5px]")} />
            <div className={cn(block, "w-full h-[5px]")} />
            <div className={cn(blockLight, "w-2/3 h-[5px] mt-[2px]")} />
          </div>
        </div>
      );
    case "landing":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(blockLight, "w-full h-[20px]")} />
          <div className={cn(block, "w-full h-[10px]")} />
          <div className={cn(block, "w-full flex-1")} />
        </div>
      );
    case "quiz":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(blockLight, "w-3/4 h-[6px] mx-auto")} />
          <div className="grid grid-cols-2 gap-[2px] flex-1">
            <div className={cn(block)} />
            <div className={cn(block)} />
            <div className={cn(block)} />
            <div className={cn(block)} />
          </div>
        </div>
      );
    case "search":
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(blockLight, "w-full h-[5px]")} />
          <div className="flex flex-col gap-[2px] flex-1">
            <div className={cn(block, "w-full h-[7px]")} />
            <div className={cn(block, "w-full h-[7px]")} />
            <div className={cn(block, "w-full h-[7px]")} />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col gap-[3px] p-[6px] h-full">
          <div className={cn(bar)} />
          <div className={cn(block, "w-full flex-1")} />
        </div>
      );
  }
}

/* ─── Entry point pills shown above the node ─── */
function EntryPointPills({ entryPoints }: { entryPoints: SiteNode["entryPoints"] }) {
  if (!entryPoints || entryPoints.length === 0) return null;

  const EP_COLORS: Record<string, string> = {
    google: "#4285F4",
    social: "#E1306C",
    ads: "#FBBC04",
    direct: "#34A853",
    nav: "#8B8B93",
    email: "#8B8B93",
    qrcode: "#8B8B93",
  };

  const EP_LABELS: Record<string, string> = {
    google: "G",
    social: "S",
    ads: "A",
    direct: "D",
    nav: "→",
    email: "@",
    qrcode: "Q",
  };

  return (
    <div className="flex items-center justify-center gap-1 mb-1.5">
      {entryPoints.slice(0, 4).map((ep, i) => (
        <div
          key={i}
          className="flex items-center gap-[3px] px-[5px] py-[1px] rounded-full text-[7px] font-medium leading-none"
          style={{
            backgroundColor: `${EP_COLORS[ep.type] || "#8B8B93"}20`,
            color: EP_COLORS[ep.type] || "#8B8B93",
            border: `1px solid ${EP_COLORS[ep.type] || "#8B8B93"}30`,
          }}
          title={ep.label}
        >
          <span>{EP_LABELS[ep.type]}</span>
        </div>
      ))}
      {entryPoints.length > 4 && (
        <span className="text-[7px] text-label-faint">+{entryPoints.length - 4}</span>
      )}
    </div>
  );
}

/* ─── Main site node ─── */
function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />

      <div className="flex flex-col items-center">
        {/* Entry points above */}
        <EntryPointPills entryPoints={data.entryPoints} />

        {/* Page preview card */}
        <div
          className={cn(
            "w-[140px] h-[100px] rounded-lg overflow-hidden cursor-pointer",
            "transition-all duration-200 ease-out",
            "hover:translate-y-[-2px] hover:shadow-[0_4px_20px_rgba(255,255,255,0.06)]",
            "active:translate-y-[0px]",
            selected
              ? "ring-2 ring-white/60 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
              : "ring-1 ring-white/[0.12] hover:ring-white/25",
            data.priority === "utility" && !selected && "ring-dashed opacity-70",
          )}
          style={{ background: "#141416" }}
        >
          <MiniZoning type={data.zoning} />
        </div>

        {/* Label */}
        <div className="mt-2 text-center max-w-[160px]">
          <p className={cn(
            "text-xs font-medium leading-tight truncate",
            selected ? "text-white" : "text-white/70"
          )}>
            {data.label}
          </p>
          {data.priority === "primary" && (
            <p className="text-[9px] text-white/30 mt-0.5 truncate">
              {data.description?.slice(0, 40)}
            </p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
    </>
  );
}

export default memo(SiteNodeComponent);
