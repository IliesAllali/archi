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
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Hero", h: 60, skin: "hero" },
    { label: "Cards", h: 48, skin: "cards" },
    { label: "Mise en avant", h: 36, skin: "image" },
    { label: "CTA", h: 28, skin: "cta" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  listing: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Breadcrumb", h: 14, skin: "breadcrumb" },
    { label: "Filtres", h: 22, skin: "filtres" },
    { label: "Grille", h: 56, skin: "grille" },
    { label: "Pagination", h: 16, skin: "pagination" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  detail: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Breadcrumb", h: 14, skin: "breadcrumb" },
    { label: "Contenu", h: 60, skin: "contenu" },
    { label: "Sidebar", h: 36, skin: "sidebar" },
    { label: "CTA", h: 28, skin: "cta" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  form: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Titre", h: 20, skin: "titre" },
    { label: "Formulaire", h: 60, skin: "form" },
    { label: "Envoi", h: 22, skin: "submit" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  landing: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Hero", h: 64, skin: "hero" },
    { label: "Arguments", h: 42, skin: "arguments" },
    { label: "Social proof", h: 28, skin: "social-proof" },
    { label: "CTA", h: 28, skin: "cta" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  quiz: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Progression", h: 14, skin: "progression" },
    { label: "Question", h: 28, skin: "question" },
    { label: "Réponses", h: 52, skin: "reponses" },
    { label: "Nav quiz", h: 18, skin: "nav-quiz" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
  search: [
    { label: "Navigation", h: 18, skin: "nav" },
    { label: "Recherche", h: 22, skin: "search-bar" },
    { label: "Résultats", h: 56, skin: "resultats" },
    { label: "Pagination", h: 16, skin: "pagination" },
    { label: "Footer", h: 20, skin: "footer" },
  ],
};

/* ─── Layout constants ─── */

const SECTION_GAP = 1;
const CARD_PAD = 3;
const TITLE_HEIGHT = 26;
const LABEL_H = 13; // height for section label row
export const CARD_WIDTH = 160;

export function getCardHeight(zoning: ZoningType): number {
  const sections = ZONING_SECTIONS[zoning] || ZONING_SECTIONS.detail;
  const totalH = sections.reduce((sum, s) => sum + s.h + LABEL_H, 0);
  const gaps = (sections.length - 1) * SECTION_GAP;
  return TITLE_HEIGHT + totalH + gaps + CARD_PAD * 2;
}

/* ─────────────────────────────────────────────
   Wireframe skins — tiny structural previews
   Each renders inside its section block to give
   a distinct visual identity at a glance.
   ───────────────────────────────────────────── */

const b = "wf-strong"; // wireframe element — styled via CSS
const bf = "wf-faint"; // wireframe faint — styled via CSS

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
        <div key={i} className="flex-1 rounded-sm flex flex-col gap-[2px] p-[2px] wf-card">
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
      <span className="wf-text text-[4px]">›</span>
      <div className={cn(bf, "w-[12px] h-[2px] rounded-sm")} />
      <span className="wf-text text-[4px]">›</span>
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
        <div key={i} className="rounded-sm flex flex-col gap-[1px] p-[2px] wf-card">
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
      <div className="flex-1 rounded-sm wf-card p-[2px]">
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
          <div className="w-full h-[5px] rounded wf-border" style={{ borderWidth: 1 }} />
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
        <div key={i} className="rounded-sm flex items-center justify-center wf-border" style={{ borderWidth: 1 }}>
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
      <div className="flex items-center gap-[2px] w-full h-[7px] rounded-full wf-border px-[3px]" style={{ borderWidth: 1 }}>
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
      <div className="w-full h-full rounded-sm wf-card flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="wf-stroke" strokeWidth="1.5">
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

/* ─── Section colors — each type gets a unique tint ─── */
const SECTION_COLORS: Record<string, string> = {
  nav:            "rgba(139,147,165,0.20)",
  hero:           "rgba(124,93,250,0.18)",
  cards:          "rgba(67,140,245,0.16)",
  cta:            "rgba(187,109,244,0.18)",
  footer:         "rgba(100,116,139,0.16)",
  breadcrumb:     "rgba(139,147,165,0.12)",
  filtres:        "rgba(88,137,255,0.16)",
  grille:         "rgba(76,142,245,0.15)",
  contenu:        "rgba(79,150,255,0.15)",
  sidebar:        "rgba(85,182,241,0.14)",
  form:           "rgba(255,129,152,0.16)",
  submit:         "rgba(168,111,247,0.18)",
  titre:          "rgba(91,142,255,0.15)",
  arguments:      "rgba(255,143,115,0.16)",
  "social-proof": "rgba(124,155,255,0.14)",
  progression:    "rgba(103,187,255,0.14)",
  question:       "rgba(95,141,253,0.16)",
  reponses:       "rgba(78,139,255,0.15)",
  "nav-quiz":     "rgba(115,147,255,0.14)",
  "search-bar":   "rgba(57,210,189,0.16)",
  resultats:      "rgba(74,143,247,0.15)",
  pagination:     "rgba(153,170,197,0.14)",
  image:          "rgba(111,183,255,0.14)",
};

const SECTION_BORDER_COLORS: Record<string, string> = {
  nav:            "rgba(139,147,165,0.40)",
  hero:           "rgba(124,93,250,0.40)",
  cards:          "rgba(67,140,245,0.35)",
  cta:            "rgba(187,109,244,0.40)",
  footer:         "rgba(100,116,139,0.30)",
  breadcrumb:     "rgba(139,147,165,0.25)",
  filtres:        "rgba(88,137,255,0.35)",
  grille:         "rgba(76,142,245,0.30)",
  contenu:        "rgba(79,150,255,0.30)",
  sidebar:        "rgba(85,182,241,0.30)",
  form:           "rgba(255,129,152,0.35)",
  submit:         "rgba(168,111,247,0.40)",
  titre:          "rgba(91,142,255,0.30)",
  arguments:      "rgba(255,143,115,0.35)",
  "social-proof": "rgba(124,155,255,0.28)",
  progression:    "rgba(103,187,255,0.28)",
  question:       "rgba(95,141,253,0.35)",
  reponses:       "rgba(78,139,255,0.30)",
  "nav-quiz":     "rgba(115,147,255,0.30)",
  "search-bar":   "rgba(57,210,189,0.35)",
  resultats:      "rgba(74,143,247,0.30)",
  pagination:     "rgba(153,170,197,0.28)",
  image:          "rgba(111,183,255,0.28)",
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
          "rounded overflow-hidden cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:translate-y-[-1px]",
          data.priority === "utility" && !selected && "opacity-45",
        )}
        style={{
          width: CARD_WIDTH,
          height: cardH,
          background: "var(--card-bg)",
          boxShadow: selected
            ? "0 0 0 1.5px var(--card-ring-selected), 0 0 20px var(--wireframe-faint)"
            : "0 0 0 1px var(--card-ring)",
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = "0 0 0 1px var(--card-ring-hover)";
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = "0 0 0 1px var(--card-ring)";
        }}
      >
        {/* ── Page title ── */}
        <div
          className="flex items-center px-[7px]"
          style={{
            height: TITLE_HEIGHT,
            background: "var(--card-title-bg)",
            borderBottom: "1px solid var(--card-title-border)",
          }}
        >
          <p
            className="font-bold leading-none truncate w-full"
            style={{
              fontSize: "11px",
              color: selected ? "var(--title-selected)" : "var(--title-color)",
            }}
          >
            {data.label}
          </p>
        </div>

        {/* ── Section bricks — octopus.do style ── */}
        <div className="flex flex-col" style={{ padding: CARD_PAD, gap: SECTION_GAP }}>
          {sections.map((section, i) => {
            const Skin = SKIN_MAP[section.skin] || SkinDefault;
            const bg = SECTION_COLORS[section.skin] || "var(--wireframe-faint)";
            const border = SECTION_BORDER_COLORS[section.skin] || "var(--wireframe-strong)";
            return (
              <div
                key={i}
                className="flex flex-col rounded-sm overflow-hidden"
                style={{
                  background: bg,
                  borderLeft: `2px solid ${border}`,
                }}
              >
                {/* Label row */}
                <div
                  className="flex items-center px-[4px] shrink-0"
                  style={{ height: LABEL_H, paddingTop: 2 }}
                >
                  <span
                    className="leading-none select-none font-semibold truncate"
                    style={{ fontSize: "5.5px", color: "var(--label-color)" }}
                  >
                    {section.label}
                  </span>
                </div>
                {/* Wireframe skin */}
                <div style={{ height: section.h }}>
                  <Skin />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default memo(SiteNodeComponent);
