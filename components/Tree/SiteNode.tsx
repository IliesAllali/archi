"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { SiteNode, ZoningType } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Section with wireframe skin ─── */
interface Section {
  label: string;
  h: number;
  skin: "nav" | "hero" | "cards" | "cta" | "footer" | "breadcrumb" | "filtres"
    | "grille" | "contenu" | "sidebar" | "form" | "submit" | "titre" | "arguments"
    | "social-proof" | "progression" | "question" | "reponses" | "navigation"
    | "search-bar" | "resultats" | "pagination" | "text" | "image" | "steps"
    | "accordion" | "slider" | "table" | "divider";
  accent?: boolean;
}

export const ZONING_SECTIONS: Record<ZoningType, Section[]> = {
  home: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Hero", h: 55, skin: "hero", accent: true },
    { label: "Cards ×3", h: 40, skin: "cards" },
    { label: "Mise en avant", h: 30, skin: "image" },
    { label: "CTA", h: 22, skin: "cta", accent: true },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  listing: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Breadcrumb", h: 8, skin: "breadcrumb" },
    { label: "Filtres", h: 16, skin: "filtres" },
    { label: "Grille", h: 50, skin: "grille" },
    { label: "Pagination", h: 10, skin: "pagination" },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  detail: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Breadcrumb", h: 8, skin: "breadcrumb" },
    { label: "Contenu", h: 55, skin: "contenu" },
    { label: "Sidebar", h: 30, skin: "sidebar" },
    { label: "CTA", h: 22, skin: "cta", accent: true },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  form: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Titre", h: 14, skin: "titre" },
    { label: "Champs", h: 55, skin: "form" },
    { label: "Submit", h: 16, skin: "submit", accent: true },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  landing: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Hero", h: 60, skin: "hero", accent: true },
    { label: "Arguments", h: 35, skin: "arguments" },
    { label: "Social proof", h: 24, skin: "social-proof" },
    { label: "CTA", h: 22, skin: "cta", accent: true },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  quiz: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Progression", h: 8, skin: "progression" },
    { label: "Question", h: 22, skin: "question" },
    { label: "Réponses ×4", h: 44, skin: "reponses" },
    { label: "Navigation", h: 14, skin: "navigation" },
    { label: "Footer", h: 16, skin: "footer" },
  ],
  search: [
    { label: "Navigation", h: 14, skin: "nav" },
    { label: "Recherche", h: 18, skin: "search-bar" },
    { label: "Résultats", h: 50, skin: "resultats" },
    { label: "Pagination", h: 10, skin: "pagination" },
    { label: "Footer", h: 16, skin: "footer" },
  ],
};

const SECTION_GAP = 2;
const CARD_PAD = 4;
const TITLE_HEIGHT = 20;
export const CARD_WIDTH = 160;

export function getCardHeight(zoning: ZoningType): number {
  const sections = ZONING_SECTIONS[zoning] || ZONING_SECTIONS.detail;
  const totalH = sections.reduce((sum, s) => sum + s.h, 0);
  const gaps = sections.length * SECTION_GAP; // gap above each section
  return TITLE_HEIGHT + totalH + gaps + CARD_PAD;
}

/* ─── Wireframe skins — tiny structural previews ─── */
const w = "bg-white/20"; // wireframe element color
const wf = "bg-white/10"; // wireframe faint

function SkinNav() {
  return (
    <div className="flex items-center justify-between h-full px-[6px]">
      <div className={cn(w, "w-[14px] h-[4px] rounded-[1px]")} />
      <div className="flex gap-[3px]">
        <div className={cn(wf, "w-[10px] h-[3px] rounded-[1px]")} />
        <div className={cn(wf, "w-[10px] h-[3px] rounded-[1px]")} />
        <div className={cn(wf, "w-[10px] h-[3px] rounded-[1px]")} />
      </div>
    </div>
  );
}

function SkinHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-[4px] px-[8px]">
      <div className={cn(w, "w-[60%] h-[4px] rounded-[1px]")} />
      <div className={cn(wf, "w-[45%] h-[3px] rounded-[1px]")} />
      <div className={cn(w, "w-[30px] h-[7px] rounded-[2px] mt-[3px]")} />
    </div>
  );
}

function SkinCards() {
  return (
    <div className="flex gap-[3px] h-full p-[4px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn("flex-1 rounded-[2px] flex flex-col gap-[2px] p-[3px]")} style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className={cn(wf, "w-full h-[12px] rounded-[1px]")} />
          <div className={cn(wf, "w-[70%] h-[2px] rounded-[1px]")} />
          <div className={cn(wf, "w-[50%] h-[2px] rounded-[1px]")} />
        </div>
      ))}
    </div>
  );
}

function SkinCta() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className={cn(w, "w-[50px] h-[8px] rounded-[2px]")} />
    </div>
  );
}

function SkinFooter() {
  return (
    <div className="flex items-center justify-between h-full px-[6px]">
      <div className={cn(wf, "w-[12px] h-[3px] rounded-[1px]")} />
      <div className="flex gap-[4px]">
        <div className={cn(wf, "w-[8px] h-[2px] rounded-[1px]")} />
        <div className={cn(wf, "w-[8px] h-[2px] rounded-[1px]")} />
        <div className={cn(wf, "w-[8px] h-[2px] rounded-[1px]")} />
      </div>
    </div>
  );
}

function SkinBreadcrumb() {
  return (
    <div className="flex items-center gap-[2px] h-full px-[6px]">
      <div className={cn(wf, "w-[8px] h-[2px] rounded-[1px]")} />
      <span className="text-white/10" style={{ fontSize: "5px" }}>/</span>
      <div className={cn(wf, "w-[14px] h-[2px] rounded-[1px]")} />
      <span className="text-white/10" style={{ fontSize: "5px" }}>/</span>
      <div className={cn(w, "w-[10px] h-[2px] rounded-[1px]")} />
    </div>
  );
}

function SkinFiltres() {
  return (
    <div className="flex items-center gap-[3px] h-full px-[6px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn(i === 0 ? w : wf, "h-[5px] px-[5px] rounded-full")} style={{ width: i === 0 ? 20 : 16 }} />
      ))}
    </div>
  );
}

function SkinGrille() {
  return (
    <div className="grid grid-cols-3 gap-[3px] h-full p-[4px]">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-[2px] flex flex-col gap-[2px] p-[2px]" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className={cn(wf, "w-full h-[8px] rounded-[1px]")} />
          <div className={cn(wf, "w-[65%] h-[2px] rounded-[1px]")} />
        </div>
      ))}
    </div>
  );
}

function SkinContenu() {
  return (
    <div className="flex flex-col gap-[4px] h-full p-[6px]">
      <div className={cn(w, "w-[70%] h-[4px] rounded-[1px]")} />
      <div className={cn(wf, "w-full h-[2px] rounded-[1px]")} />
      <div className={cn(wf, "w-full h-[2px] rounded-[1px]")} />
      <div className={cn(wf, "w-[90%] h-[2px] rounded-[1px]")} />
      <div className={cn(wf, "w-full h-[10px] rounded-[1px] mt-[2px]")} />
      <div className={cn(wf, "w-full h-[2px] rounded-[1px]")} />
      <div className={cn(wf, "w-[80%] h-[2px] rounded-[1px]")} />
    </div>
  );
}

function SkinSidebar() {
  return (
    <div className="flex gap-[4px] h-full p-[4px]">
      <div className="flex-[2] flex flex-col gap-[2px]">
        <div className={cn(wf, "w-full h-[3px] rounded-[1px]")} />
        <div className={cn(wf, "w-[80%] h-[3px] rounded-[1px]")} />
      </div>
      <div className="flex-1 rounded-[2px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="flex flex-col gap-[2px] p-[3px]">
          <div className={cn(wf, "w-full h-[3px] rounded-[1px]")} />
          <div className={cn(wf, "w-[60%] h-[2px] rounded-[1px]")} />
        </div>
      </div>
    </div>
  );
}

function SkinForm() {
  return (
    <div className="flex flex-col gap-[5px] h-full p-[6px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-[2px]">
          <div className={cn(wf, "w-[30%] h-[2px] rounded-[1px]")} />
          <div className={cn("w-full h-[6px] rounded-[2px] border border-white/[0.08]")} />
        </div>
      ))}
    </div>
  );
}

function SkinSubmit() {
  return (
    <div className="flex items-center justify-end h-full px-[6px]">
      <div className={cn(w, "w-[40px] h-[8px] rounded-[2px]")} />
    </div>
  );
}

function SkinTitre() {
  return (
    <div className="flex flex-col justify-center h-full px-[6px] gap-[2px]">
      <div className={cn(w, "w-[65%] h-[4px] rounded-[1px]")} />
      <div className={cn(wf, "w-[45%] h-[2px] rounded-[1px]")} />
    </div>
  );
}

function SkinArguments() {
  return (
    <div className="flex gap-[3px] h-full p-[4px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-[3px] p-[3px]">
          <div className={cn(w, "w-[10px] h-[10px] rounded-full")} />
          <div className={cn(wf, "w-[80%] h-[2px] rounded-[1px]")} />
          <div className={cn(wf, "w-[60%] h-[2px] rounded-[1px]")} />
        </div>
      ))}
    </div>
  );
}

function SkinSocialProof() {
  return (
    <div className="flex items-center justify-center gap-[6px] h-full px-[6px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(wf, "w-[16px] h-[8px] rounded-[1px]")} />
      ))}
    </div>
  );
}

function SkinProgression() {
  return (
    <div className="flex items-center h-full px-[6px] gap-[2px]">
      <div className={cn(w, "flex-1 h-[3px] rounded-full")} />
      <div className={cn(wf, "flex-[2] h-[3px] rounded-full")} />
    </div>
  );
}

function SkinQuestion() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-[3px]">
      <div className={cn(w, "w-[60%] h-[4px] rounded-[1px]")} />
      <div className={cn(wf, "w-[40%] h-[2px] rounded-[1px]")} />
    </div>
  );
}

function SkinReponses() {
  return (
    <div className="grid grid-cols-2 gap-[3px] h-full p-[4px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-[2px] flex items-center justify-center border border-white/[0.08]">
          <div className={cn(wf, "w-[60%] h-[3px] rounded-[1px]")} />
        </div>
      ))}
    </div>
  );
}

function SkinNavigation() {
  return (
    <div className="flex items-center justify-between h-full px-[6px]">
      <div className={cn(wf, "w-[24px] h-[6px] rounded-[2px]")} />
      <div className={cn(w, "w-[24px] h-[6px] rounded-[2px]")} />
    </div>
  );
}

function SkinSearchBar() {
  return (
    <div className="flex items-center justify-center h-full px-[6px]">
      <div className="flex items-center gap-[3px] w-full h-[8px] rounded-full border border-white/[0.08] px-[4px]">
        <div className={cn(wf, "w-[4px] h-[4px] rounded-full shrink-0")} />
        <div className={cn(wf, "flex-1 h-[2px] rounded-[1px]")} />
      </div>
    </div>
  );
}

function SkinResultats() {
  return (
    <div className="flex flex-col gap-[4px] h-full p-[5px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-[4px]">
          <div className={cn(wf, "w-[16px] h-[10px] rounded-[1px] shrink-0")} />
          <div className="flex flex-col gap-[1px] flex-1">
            <div className={cn(wf, "w-[70%] h-[2px] rounded-[1px]")} />
            <div className={cn(wf, "w-full h-[2px] rounded-[1px]")} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkinPagination() {
  return (
    <div className="flex items-center justify-center gap-[2px] h-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(i === 1 ? w : wf, "w-[5px] h-[5px] rounded-[1px]")} />
      ))}
    </div>
  );
}

function SkinImage() {
  return (
    <div className="flex items-center justify-center h-full p-[4px]">
      <div className="w-full h-full rounded-[2px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </div>
  );
}

function SkinDefault() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className={cn(wf, "w-[40%] h-[3px] rounded-[1px]")} />
    </div>
  );
}

const SKIN_MAP: Record<string, React.FC> = {
  nav: SkinNav,
  hero: SkinHero,
  cards: SkinCards,
  cta: SkinCta,
  footer: SkinFooter,
  breadcrumb: SkinBreadcrumb,
  filtres: SkinFiltres,
  grille: SkinGrille,
  contenu: SkinContenu,
  sidebar: SkinSidebar,
  form: SkinForm,
  submit: SkinSubmit,
  titre: SkinTitre,
  arguments: SkinArguments,
  "social-proof": SkinSocialProof,
  progression: SkinProgression,
  question: SkinQuestion,
  reponses: SkinReponses,
  navigation: SkinNavigation,
  "search-bar": SkinSearchBar,
  resultats: SkinResultats,
  pagination: SkinPagination,
  image: SkinImage,
  text: SkinDefault,
  steps: SkinDefault,
  accordion: SkinDefault,
  slider: SkinImage,
  table: SkinGrille,
  divider: SkinDefault,
};

/* ─── Main site node ─── */
function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  const sections = ZONING_SECTIONS[data.zoning] || ZONING_SECTIONS.detail;
  const cardH = getCardHeight(data.zoning);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
      {/* Side handles for cross-links */}
      <Handle id="left" type="target" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0 !w-0 !h-0" />

      <div
        className={cn(
          "rounded-lg overflow-hidden cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:translate-y-[-2px]",
          "active:translate-y-[0px]",
          selected
            ? "ring-[1.5px] ring-white shadow-[0_0_24px_rgba(255,255,255,0.1)]"
            : "ring-1 ring-white/[0.15] hover:ring-white/30",
          data.priority === "utility" && !selected && "opacity-50",
        )}
        style={{ width: CARD_WIDTH, height: cardH, background: "#101012" }}
      >
        {/* Page title — inside card at top */}
        <div
          className="flex items-center px-[6px] border-b border-white/[0.08]"
          style={{ height: TITLE_HEIGHT }}
        >
          <p className={cn(
            "text-[8px] font-semibold leading-none truncate w-full",
            selected ? "text-white" : "text-white/70"
          )}>
            {data.label}
          </p>
        </div>

        {/* Sections */}
        {sections.map((section, i) => {
          const Skin = SKIN_MAP[section.skin] || SkinDefault;
          return (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{
                height: section.h,
                marginTop: i === 0 ? SECTION_GAP : SECTION_GAP,
                marginLeft: CARD_PAD,
                marginRight: CARD_PAD,
                borderRadius: 3,
                backgroundColor: section.accent
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              <Skin />
              {/* Section label — top-left, visible white */}
              <span
                className="absolute top-[2px] left-[4px] text-white/40 leading-none select-none pointer-events-none font-medium uppercase tracking-wider"
                style={{ fontSize: "4.5px" }}
              >
                {section.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default memo(SiteNodeComponent);
