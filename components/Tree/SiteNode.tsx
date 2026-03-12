"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { SiteNode, ZoningType } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Section definitions per zoning type ─── */
interface Section {
  label: string;
  h: number;
  accent?: boolean;
}

export const ZONING_SECTIONS: Record<ZoningType, Section[]> = {
  home: [
    { label: "Nav", h: 5 },
    { label: "Hero", h: 22, accent: true },
    { label: "Cards ×3", h: 14 },
    { label: "Mise en avant", h: 10 },
    { label: "CTA", h: 7, accent: true },
    { label: "Footer", h: 5 },
  ],
  listing: [
    { label: "Nav", h: 5 },
    { label: "Breadcrumb", h: 3 },
    { label: "Filtres", h: 7 },
    { label: "Grille", h: 18 },
    { label: "Pagination", h: 3 },
    { label: "Footer", h: 5 },
  ],
  detail: [
    { label: "Nav", h: 5 },
    { label: "Breadcrumb", h: 3 },
    { label: "Contenu", h: 20 },
    { label: "Sidebar", h: 12 },
    { label: "CTA", h: 7, accent: true },
    { label: "Footer", h: 5 },
  ],
  form: [
    { label: "Nav", h: 5 },
    { label: "Titre", h: 5 },
    { label: "Champs", h: 20 },
    { label: "Submit", h: 5, accent: true },
    { label: "Footer", h: 5 },
  ],
  landing: [
    { label: "Nav", h: 5 },
    { label: "Hero", h: 24, accent: true },
    { label: "Arguments", h: 12 },
    { label: "Social proof", h: 8 },
    { label: "CTA", h: 7, accent: true },
    { label: "Footer", h: 5 },
  ],
  quiz: [
    { label: "Nav", h: 5 },
    { label: "Progression", h: 3 },
    { label: "Question", h: 8 },
    { label: "Réponses ×4", h: 16 },
    { label: "Navigation", h: 5 },
    { label: "Footer", h: 5 },
  ],
  search: [
    { label: "Nav", h: 5 },
    { label: "Recherche", h: 7 },
    { label: "Résultats", h: 20 },
    { label: "Pagination", h: 3 },
    { label: "Footer", h: 5 },
  ],
};

const SECTION_GAP = 1;
const CARD_PAD_X = 5;
const CARD_PAD_Y = 4;
const CARD_WIDTH = 140;

export function getCardHeight(zoning: ZoningType): number {
  const sections = ZONING_SECTIONS[zoning] || ZONING_SECTIONS.detail;
  const totalH = sections.reduce((sum, s) => sum + s.h, 0);
  const gaps = (sections.length - 1) * SECTION_GAP;
  return totalH + gaps + CARD_PAD_Y * 2;
}

/* ─── Main site node ─── */
function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  const sections = ZONING_SECTIONS[data.zoning] || ZONING_SECTIONS.detail;
  const cardH = getCardHeight(data.zoning);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />

      <div className="flex flex-col items-center">
        {/* Page card */}
        <div
          className={cn(
            "rounded-lg overflow-hidden cursor-pointer",
            "transition-all duration-200 ease-out",
            "hover:translate-y-[-2px]",
            "active:translate-y-[0px]",
            selected
              ? "ring-[1.5px] ring-white/70 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              : "ring-1 ring-white/[0.1] hover:ring-white/20",
            data.priority === "utility" && !selected && "opacity-60",
          )}
          style={{ width: CARD_WIDTH, height: cardH, background: "#131315" }}
        >
          <div
            className="flex flex-col h-full"
            style={{ padding: `${CARD_PAD_Y}px ${CARD_PAD_X}px`, gap: `${SECTION_GAP}px` }}
          >
            {sections.map((section, i) => (
              <div
                key={i}
                className="relative rounded-[2px] flex items-center"
                style={{
                  height: section.h,
                  backgroundColor: section.accent
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.05)",
                }}
              >
                <span
                  className="absolute left-[3px] text-white/30 leading-none select-none"
                  style={{ fontSize: "5px" }}
                >
                  {section.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Label */}
        <div className="mt-2 text-center" style={{ maxWidth: CARD_WIDTH + 20 }}>
          <p className={cn(
            "text-[11px] font-medium leading-tight truncate",
            selected ? "text-white" : "text-white/60"
          )}>
            {data.label}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
    </>
  );
}

export default memo(SiteNodeComponent);
