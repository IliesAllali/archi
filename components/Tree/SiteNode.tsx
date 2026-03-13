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
    { label: "Métiers — Formations", h: 28, skin: "double-cta" },
    { label: "Bloc vidéo", h: 42, skin: "image" },
    { label: "Bloc quiz", h: 20, skin: "question" },
    { label: "...", h: 10, skin: "dots" },
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

const SECTION_GAP = 2;
const CARD_PAD = 5;
const TITLE_HEIGHT = 32;
const LABEL_H = 18; // height for section label row
export const CARD_WIDTH = 110;       // compact non-home cards
export const HOME_CARD_WIDTH = 200;  // home card with zoning

export function getCardWidth(type: string): number {
  return type === "home" ? HOME_CARD_WIDTH : CARD_WIDTH;
}

export function getCardHeight(type: string, label = ""): number {
  if (type === "home") {
    const sections = ZONING_SECTIONS.home;
    const totalH = sections.reduce((sum, s) => sum + s.h + LABEL_H, 0);
    const gaps = (sections.length - 1) * SECTION_GAP;
    return TITLE_HEIGHT + totalH + gaps + CARD_PAD * 2;
  }
  // Hug content: estimate lines based on label length
  const usablePx = CARD_WIDTH - 38; // 7px pad × 2 + ~24px for children counter
  const charsPerLine = Math.max(1, Math.floor(usablePx / 8));
  const lines = Math.max(1, Math.ceil((label || " ").length / charsPerLine));
  return 9 + lines * 17 + 9; // top-pad + (lines × line-height) + bottom-pad
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
    <div className="flex items-center justify-center gap-[6px] h-full px-[5px]">
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 10, height: 10, background: "rgba(95,141,253,0.20)", border: "1px solid rgba(95,141,253,0.45)" }}
      >
        <span style={{ fontSize: "7px", lineHeight: 1, color: "rgba(95,141,253,0.85)", fontWeight: 700 }}>?</span>
      </div>
      <div className="flex flex-col gap-[2px] flex-1">
        <div className={cn(b, "w-[75%] h-[2px] rounded-sm")} />
        <div className={cn(bf, "w-[55%] h-[2px] rounded-sm")} />
      </div>
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
      <div
        className="w-full h-full rounded-sm flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.07)" }}
      >
        {/* Play button */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 16, height: 16, background: "rgba(0,0,0,0.18)" }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "4px solid transparent",
              borderBottom: "4px solid transparent",
              borderLeft: "6px solid rgba(255,255,255,0.9)",
              marginLeft: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SkinDoubleCta() {
  return (
    <div className="flex gap-[4px] h-full p-[4px]">
      {/* Filled CTA — Métiers */}
      <div
        className="flex-1 rounded flex items-center justify-center gap-[3px]"
        style={{ background: "var(--accent)", opacity: 0.9 }}
      >
        <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.85)", flexShrink: 0 }} />
        <div style={{ width: "42%", height: 2, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
      </div>
      {/* Outlined CTA — Formations */}
      <div
        className="flex-1 rounded flex items-center justify-center gap-[3px]"
        style={{ border: "1px solid var(--accent)", opacity: 0.75 }}
      >
        <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
        <div style={{ width: "42%", height: 2, borderRadius: 1, background: "var(--accent)" }} />
      </div>
    </div>
  );
}

function SkinDots() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-full">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(bf, "w-[2px] h-[2px] rounded-full")} />
      ))}
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
  dots: SkinDots,
  "double-cta": SkinDoubleCta,
};

/* ─── Section colors — tuned for white background ─── */
const SECTION_COLORS: Record<string, string> = {
  nav:            "rgba(139,147,165,0.10)",
  hero:           "rgba(124,93,250,0.09)",
  cards:          "rgba(67,140,245,0.09)",
  cta:            "rgba(187,109,244,0.09)",
  footer:         "rgba(100,116,139,0.08)",
  breadcrumb:     "rgba(139,147,165,0.07)",
  filtres:        "rgba(88,137,255,0.09)",
  grille:         "rgba(76,142,245,0.09)",
  contenu:        "rgba(79,150,255,0.09)",
  sidebar:        "rgba(85,182,241,0.08)",
  form:           "rgba(255,100,130,0.09)",
  submit:         "rgba(168,111,247,0.09)",
  titre:          "rgba(91,142,255,0.09)",
  arguments:      "rgba(255,120,80,0.09)",
  "social-proof": "rgba(100,140,255,0.08)",
  progression:    "rgba(70,180,255,0.09)",
  question:       "rgba(95,141,253,0.09)",
  reponses:       "rgba(78,139,255,0.09)",
  "nav-quiz":     "rgba(115,147,255,0.08)",
  "search-bar":   "rgba(32,195,170,0.09)",
  resultats:      "rgba(74,143,247,0.09)",
  pagination:     "rgba(153,170,197,0.08)",
  image:          "rgba(85,170,255,0.08)",
  dots:           "rgba(139,147,165,0.05)",
  "double-cta":   "rgba(94,106,210,0.08)",
};

const SECTION_BORDER_COLORS: Record<string, string> = {
  nav:            "rgba(139,147,165,0.45)",
  hero:           "rgba(124,93,250,0.55)",
  cards:          "rgba(67,140,245,0.50)",
  cta:            "rgba(187,109,244,0.55)",
  footer:         "rgba(100,116,139,0.35)",
  breadcrumb:     "rgba(139,147,165,0.30)",
  filtres:        "rgba(88,137,255,0.50)",
  grille:         "rgba(76,142,245,0.45)",
  contenu:        "rgba(79,150,255,0.45)",
  sidebar:        "rgba(85,182,241,0.40)",
  form:           "rgba(255,100,130,0.50)",
  submit:         "rgba(168,111,247,0.55)",
  titre:          "rgba(91,142,255,0.45)",
  arguments:      "rgba(255,120,80,0.50)",
  "social-proof": "rgba(100,140,255,0.40)",
  progression:    "rgba(70,180,255,0.45)",
  question:       "rgba(95,141,253,0.50)",
  reponses:       "rgba(78,139,255,0.45)",
  "nav-quiz":     "rgba(115,147,255,0.42)",
  "search-bar":   "rgba(32,195,170,0.50)",
  resultats:      "rgba(74,143,247,0.45)",
  pagination:     "rgba(153,170,197,0.38)",
  image:          "rgba(85,170,255,0.55)",
  dots:           "rgba(139,147,165,0.28)",
  "double-cta":   "rgba(94,106,210,0.70)",
};

/* ─────────────────────────────────────────────
   Group color scheme
   Each nav branch gets a distinct border color.
   ───────────────────────────────────────────── */

const GROUP_COLORS: Record<string, string> = {
  metiers:     "#5B8AF0", // blue
  formations:  "#2DB8A0", // teal
  orientation: "#E8922A", // orange
  ressources:  "#A87FD4", // purple
};

function getGroupColor(group?: string, type?: string): string {
  if (type === "home") return "var(--accent)";
  if (!group || group === "utility") return "var(--card-ring)";
  return GROUP_COLORS[group] || "var(--accent)";
}

/* ─────────────────────────────────────────────
   Main site node component
   ───────────────────────────────────────────── */

function SiteNodeComponent({ data, selected }: NodeProps<SiteNode>) {
  const isHome = data.type === "home";
  const sections = isHome ? ZONING_SECTIONS.home : [];
  const cardH = getCardHeight(data.type, data.label);
  const cardW = getCardWidth(data.type);
  const groupColor = getGroupColor(data.group, data.type);
  const isUtility = data.priority === "utility";

  const isAccentVar = groupColor.startsWith("var(");

  const baseShadow = isUtility
    ? "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--card-ring)"
    : isAccentVar
    ? "0 2px 10px rgba(0,0,0,0.10), 0 0 0 1.5px var(--accent)"
    : data.priority === "secondary"
    ? `0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px ${groupColor}55`
    : `0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px ${groupColor}66`;

  const hoverShadow = isUtility
    ? "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--card-ring-hover)"
    : isAccentVar
    ? "0 4px 18px rgba(0,0,0,0.14), 0 0 0 2px var(--accent)"
    : data.priority === "secondary"
    ? `0 3px 12px rgba(0,0,0,0.10), 0 0 0 1.5px ${groupColor}77`
    : `0 4px 16px rgba(0,0,0,0.12), 0 0 0 1.5px ${groupColor}99`;

  const selectedShadow = isAccentVar
    ? "0 4px 20px rgba(0,0,0,0.14), 0 0 0 2px var(--accent)"
    : `0 4px 20px rgba(0,0,0,0.12), 0 0 0 2px ${groupColor}`;

  const coloredStripBg = isUtility || groupColor.startsWith("var(") ? null : groupColor;
  const titleTint = isUtility || groupColor.startsWith("var(") ? "var(--card-title-bg)" : `${groupColor}12`;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
      <Handle id="left" type="target" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
      <Handle id="left" type="source" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0 !w-0 !h-0" />
      <Handle id="right" type="target" position={Position.Right} className="!opacity-0 !w-0 !h-0" />

      <div
        className={cn(
          "rounded overflow-hidden cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:translate-y-[-1px]",
          isUtility && !selected && "opacity-65",
        )}
        style={{
          width: cardW,
          ...(isHome ? { height: cardH } : {}),
          background: "var(--card-bg)",
          boxShadow: selected ? selectedShadow : baseShadow,
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = hoverShadow;
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = baseShadow;
        }}
      >
        {/* ── Colored top strip ── */}
        {isHome && (
          <div style={{ height: 4, background: "var(--accent)" }} />
        )}
        {!isHome && (coloredStripBg
          ? <div style={{ height: 3, background: coloredStripBg, opacity: data.priority === "secondary" ? 0.6 : 1 }} />
          : isUtility && <div style={{ height: 3, background: "var(--line-strong)" }} />
        )}

        {/* ── Page title ── */}
        <div
          className={cn(
            "flex justify-between gap-1 px-[7px]",
            isHome ? "items-center" : "items-start",
          )}
          style={{
            ...(isHome ? { height: TITLE_HEIGHT } : { padding: "7px 7px" }),
            background: isHome ? "var(--accent-muted)" : titleTint,
            borderBottom: isHome ? "1px solid var(--accent-strong)" : "1px solid var(--card-title-border)",
          }}
        >
          <p
            className="font-bold flex-1"
            style={{
              fontSize: "13px",
              lineHeight: "18px",
              color: selected ? "var(--title-selected)" : "var(--title-color)",
            }}
          >
            {data.label}
          </p>
          {data.children.length > 0 && (
            <span
              className="shrink-0 font-mono"
              style={{ fontSize: "9px", lineHeight: "18px", color: "var(--label-color)", opacity: 0.7 }}
            >
              {data.children.length}↓
            </span>
          )}
        </div>

        {/* ── Section bricks — home only ── */}
        {isHome && (
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
                    borderLeft: `3px solid ${border}`,
                  }}
                >
                  {/* Label row */}
                  <div
                    className="flex items-center px-[4px] shrink-0"
                    style={{ height: LABEL_H, paddingTop: 2 }}
                  >
                    <span
                      className="select-none font-semibold truncate"
                      style={{ fontSize: "8px", lineHeight: "14px", color: "var(--label-color)" }}
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
        )}
      </div>
    </>
  );
}

export default memo(SiteNodeComponent);
