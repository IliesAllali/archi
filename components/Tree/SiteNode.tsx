"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { SiteNode, ZoningType } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Section definitions per zoning type
   Each section has a label and a height in px.
   The card grows proportionally to its sections.
   ───────────────────────────────────────────── */

interface Section {
  label: string;
  h: number;
  skin: string;
}

export const ZONING_SECTIONS: Record<ZoningType, Section[]> = {
  home: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Hero", h: 48, skin: "hero" },
    { label: "Cards", h: 36, skin: "cards" },
    { label: "Mise en avant", h: 28, skin: "image" },
    { label: "CTA", h: 20, skin: "cta" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  listing: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Breadcrumb", h: 8, skin: "breadcrumb" },
    { label: "Filtres", h: 14, skin: "filtres" },
    { label: "Grille", h: 44, skin: "grille" },
    { label: "Pagination", h: 10, skin: "pagination" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  detail: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Breadcrumb", h: 8, skin: "breadcrumb" },
    { label: "Contenu", h: 48, skin: "contenu" },
    { label: "Sidebar", h: 28, skin: "sidebar" },
    { label: "CTA", h: 20, skin: "cta" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  form: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Titre", h: 14, skin: "titre" },
    { label: "Formulaire", h: 48, skin: "form" },
    { label: "Envoi", h: 14, skin: "submit" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  landing: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Hero", h: 52, skin: "hero" },
    { label: "Arguments", h: 32, skin: "arguments" },
    { label: "Social proof", h: 20, skin: "social-proof" },
    { label: "CTA", h: 20, skin: "cta" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  quiz: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Progression", h: 8, skin: "progression" },
    { label: "Question", h: 20, skin: "question" },
    { label: "Réponses", h: 40, skin: "reponses" },
    { label: "Nav quiz", h: 12, skin: "nav-quiz" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
  search: [
    { label: "Navigation", h: 12, skin: "nav" },
    { label: "Recherche", h: 16, skin: "search-bar" },
    { label: "Résultats", h: 44, skin: "resultats" },
    { label: "Pagination", h: 10, skin: "pagination" },
    { label: "Footer", h: 14, skin: "footer" },
  ],
};

/* ─── Layout constants ─── */

const SECTION_GAP = 1;
const CARD_PAD = 3;
const TITLE_HEIGHT = 18;
export const CARD_WIDTH = 160;

export function getCardHeight(zoning: ZoningType): number {
  const sections = ZONING_SECTIONS[zoning] || ZONING_SECTIONS.detail;
  const totalH = sections.reduce((sum, s) => sum + s.h, 0);
  const gaps = (sections.length - 1) * SECTION_GAP;
  return TITLE_HEIGHT + totalH + gaps + CARD_PAD * 2;
}

/* ─────────────────────────────────────────────
   Wireframe skins — tiny structural previews
   Each renders inside its section block to give
   a distinct visual identity at a glance.
   ───────────────────────────────────────────── */

const b = "bg-white/[0.14]"; // block element
const bf = "bg-white/[0.08]"; // faint element

function SkinNav() {
  return (
    <div className="flex items-center justify-between h-full px-[5px]">
      <div className={cn(b, "w-[12px] h-[3px] rounded-sm")} />
      <div className="flex gap-[2px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(bf, "w-[8px] h-[2px] rounded-sm")} />
        ))}
      </div>
    </div>
  );
}

function SkinHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-[3px]">
      <div className={cn(b, "w-[55%] h-[3px] rounded-sm")} />
      <div className={cn(bf, "w-[38%] h-[2px] rounded-sm")} />
      <div className={cn(b, "w-[26px] h-[6px] rounded mt-[2px]")} />
    </div>
  );
}

function SkinCards() {
  return (
    <div className="flex gap-[2px] h-full p-[3px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 rounded-sm flex flex-col gap-[2px] p-[2px] bg-white/[0.04]">
          <div className={cn(bf, "w-full h-[10px] rounded-sm")} />
          <div className={cn(bf, "w-[65%] h-[2px] rounded-sm")} />
          <div className={cn(bf, "w-[45%] h-[2px] rounded-sm")} />
        </div>
      ))}
    </div>
  );
}

function SkinCta() {
  return (
    <div className="flex items-center justify-center h-full gap-[6px]">
      <div className={cn(bf, "w-[30%] h-[2px] rounded-sm")} />
      <div className={cn(b, "w-[36px] h-[7px] rounded")} />
    </div>
  );
}

function SkinFooter() {
  return (
    <div className="flex items-center justify-between h-full px-[5px]">
      <div className={cn(bf, "w-[10px] h-[2px] rounded-sm")} />
      <div className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(bf, "w-[6px] h-[2px] rounded-sm")} />
        ))}
      </div>
    </div>
  );
}

function SkinBreadcrumb() {
  return (
    <div className="flex items-center gap-[2px] h-full px-[5px]">
      <div className={cn(bf, "w-[6px] h-[2px] rounded-sm")} />
      <span className="text-white/10 text-[4px]">›</span>
      <div className={cn(bf, "w-[12px] h-[2px] rounded-sm")} />
      <span className="text-white/10 text-[4px]">›</span>
      <div className={cn(b, "w-[8px] h-[2px] rounded-sm")} />
    </div>
  );
}

function SkinFiltres() {
  return (
    <div className="flex items-center gap-[2px] h-full px-[5px]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(i === 0 ? b : bf, "h-[4px] rounded-full")}
          style={{ width: i === 0 ? 18 : 14 }}
        />
      ))}
    </div>
  );
}

function SkinGrille() {
  return (
    <div className="grid grid-cols-3 gap-[2px] h-full p-[3px]">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-sm flex flex-col gap-[1px] p-[2px] bg-white/[0.04]">
          <div className={cn(bf, "w-full h-[7px] rounded-sm")} />
          <div className={cn(bf, "w-[60%] h-[2px] rounded-sm")} />
        </div>
      ))}
    </div>
  );
}

function SkinContenu() {
  return (
    <div className="flex flex-col gap-[3px] h-full p-[5px]">
      <div className={cn(b, "w-[65%] h-[3px] rounded-sm")} />
      <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
      <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
      <div className={cn(bf, "w-[85%] h-[2px] rounded-sm")} />
      <div className={cn(bf, "w-full h-[8px] rounded-sm mt-[2px]")} />
      <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
      <div className={cn(bf, "w-[75%] h-[2px] rounded-sm")} />
    </div>
  );
}

function SkinSidebar() {
  return (
    <div className="flex gap-[3px] h-full p-[3px]">
      <div className="flex-[2] flex flex-col gap-[2px]">
        <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
        <div className={cn(bf, "w-[75%] h-[2px] rounded-sm")} />
      </div>
      <div className="flex-1 rounded-sm bg-white/[0.04] p-[2px]">
        <div className="flex flex-col gap-[2px]">
          <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
          <div className={cn(bf, "w-[55%] h-[2px] rounded-sm")} />
        </div>
      </div>
    </div>
  );
}

function SkinForm() {
  return (
    <div className="flex flex-col gap-[4px] h-full p-[5px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-[1px]">
          <div className={cn(bf, "w-[28%] h-[2px] rounded-sm")} />
          <div className="w-full h-[5px] rounded border border-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function SkinSubmit() {
  return (
    <div className="flex items-center justify-end h-full px-[5px]">
      <div className={cn(b, "w-[34px] h-[7px] rounded")} />
    </div>
  );
}

function SkinTitre() {
  return (
    <div className="flex flex-col justify-center h-full px-[5px] gap-[2px]">
      <div className={cn(b, "w-[60%] h-[3px] rounded-sm")} />
      <div className={cn(bf, "w-[40%] h-[2px] rounded-sm")} />
    </div>
  );
}

function SkinArguments() {
  return (
    <div className="flex gap-[3px] h-full p-[3px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-[2px] p-[2px]">
          <div className={cn(b, "w-[8px] h-[8px] rounded-full")} />
          <div className={cn(bf, "w-[75%] h-[2px] rounded-sm")} />
          <div className={cn(bf, "w-[55%] h-[2px] rounded-sm")} />
        </div>
      ))}
    </div>
  );
}

function SkinSocialProof() {
  return (
    <div className="flex items-center justify-center gap-[5px] h-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(bf, "w-[14px] h-[6px] rounded-sm")} />
      ))}
    </div>
  );
}

function SkinProgression() {
  return (
    <div className="flex items-center h-full px-[5px] gap-[2px]">
      <div className={cn(b, "flex-1 h-[3px] rounded-full")} />
      <div className={cn(bf, "flex-[2] h-[3px] rounded-full")} />
    </div>
  );
}

function SkinQuestion() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-[2px]">
      <div className={cn(b, "w-[55%] h-[3px] rounded-sm")} />
      <div className={cn(bf, "w-[35%] h-[2px] rounded-sm")} />
    </div>
  );
}

function SkinReponses() {
  return (
    <div className="grid grid-cols-2 gap-[2px] h-full p-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-sm flex items-center justify-center border border-white/[0.06]">
          <div className={cn(bf, "w-[55%] h-[2px] rounded-sm")} />
        </div>
      ))}
    </div>
  );
}

function SkinNavQuiz() {
  return (
    <div className="flex items-center justify-between h-full px-[5px]">
      <div className={cn(bf, "w-[20px] h-[5px] rounded")} />
      <div className={cn(b, "w-[20px] h-[5px] rounded")} />
    </div>
  );
}

function SkinSearchBar() {
  return (
    <div className="flex items-center justify-center h-full px-[5px]">
      <div className="flex items-center gap-[2px] w-full h-[7px] rounded-full border border-white/[0.06] px-[3px]">
        <div className={cn(bf, "w-[3px] h-[3px] rounded-full shrink-0")} />
        <div className={cn(bf, "flex-1 h-[2px] rounded-sm")} />
      </div>
    </div>
  );
}

function SkinResultats() {
  return (
    <div className="flex flex-col gap-[3px] h-full p-[4px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-[3px]">
          <div className={cn(bf, "w-[14px] h-[8px] rounded-sm shrink-0")} />
          <div className="flex flex-col gap-[1px] flex-1">
            <div className={cn(bf, "w-[65%] h-[2px] rounded-sm")} />
            <div className={cn(bf, "w-full h-[2px] rounded-sm")} />
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
        <div key={i} className={cn(i === 1 ? b : bf, "w-[4px] h-[4px] rounded-sm")} />
      ))}
    </div>
  );
}

function SkinImage() {
  return (
    <div className="flex items-center justify-center h-full p-[3px]">
      <div className="w-full h-full rounded-sm bg-white/[0.04] flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5">
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
      <div className={cn(bf, "w-[35%] h-[2px] rounded-sm")} />
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
  "nav-quiz": SkinNavQuiz,
  "search-bar": SkinSearchBar,
  resultats: SkinResultats,
  pagination: SkinPagination,
  image: SkinImage,
};

/* ─────────────────────────────────────────────
   Main site node component
   ───────────────────────────────────────────── */

function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  const sections = ZONING_SECTIONS[data.zoning] || ZONING_SECTIONS.detail;
  const cardH = getCardHeight(data.zoning);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
      <Handle id="left" type="target" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0 !w-0 !h-0" />

      <div
        className={cn(
          "rounded-lg overflow-hidden cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:translate-y-[-1px]",
          selected
            ? "ring-[1.5px] ring-white/80 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            : "ring-1 ring-white/[0.12] hover:ring-white/25",
          data.priority === "utility" && !selected && "opacity-45",
        )}
        style={{ width: CARD_WIDTH, height: cardH, background: "#0e0e10" }}
      >
        {/* ── Page title bar ── */}
        <div
          className="flex items-center px-[6px]"
          style={{
            height: TITLE_HEIGHT,
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className={cn(
              "text-[7.5px] font-semibold leading-none truncate w-full",
              selected ? "text-white/90" : "text-white/60",
            )}
          >
            {data.label}
          </p>
        </div>

        {/* ── Section blocks ── */}
        <div style={{ padding: CARD_PAD }}>
          {sections.map((section, i) => {
            const Skin = SKIN_MAP[section.skin] || SkinDefault;
            return (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{
                  height: section.h,
                  marginTop: i === 0 ? 0 : SECTION_GAP,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.025)",
                  borderLeft: "2px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Section label */}
                <span
                  className="absolute top-[1px] left-[4px] text-white/30 leading-none select-none pointer-events-none font-medium"
                  style={{ fontSize: "4px", letterSpacing: "0.03em" }}
                >
                  {section.label}
                </span>
                {/* Wireframe skin */}
                <Skin />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default memo(SiteNodeComponent);
