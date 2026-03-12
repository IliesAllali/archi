"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  PAGE_TYPE_CONFIG,
  PRIORITY_CONFIG,
  type SiteNode,
  type ZoningType,
} from "@/lib/types";
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
const TITLE_HEIGHT = 32;
const MIN_SECTION_HEIGHT = 16;
const SECTION_HEADER_HEIGHT = 8;
export const CARD_WIDTH = 160;

function getSectionHeight(section: Section): number {
  return Math.max(section.h, MIN_SECTION_HEIGHT);
}

export function getCardHeight(zoning: ZoningType): number {
  const sections = ZONING_SECTIONS[zoning] || ZONING_SECTIONS.detail;
  const totalH = sections.reduce((sum, s) => sum + getSectionHeight(s), 0);
  const gaps = sections.length * SECTION_GAP; // gap above each section
  return TITLE_HEIGHT + totalH + gaps + CARD_PAD;
}

type SectionSkin = Section["skin"];

const SECTION_STYLES: Partial<Record<SectionSkin, {
  shell: string;
  header: string;
  border: string;
}>> = {
  nav: {
    shell: "linear-gradient(180deg, #35d4c4 0%, #20b9a8 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(11, 117, 105, 0.22)",
  },
  hero: {
    shell: "linear-gradient(180deg, #f6b34d 0%, #ed9a32 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(164, 92, 15, 0.22)",
  },
  cards: {
    shell: "linear-gradient(180deg, #438cf5 0%, #2f73e4 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(23, 72, 168, 0.18)",
  },
  cta: {
    shell: "linear-gradient(180deg, #bb6df4 0%, #9b56df 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(103, 47, 157, 0.24)",
  },
  footer: {
    shell: "linear-gradient(180deg, #8ca0bf 0%, #7689a8 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(79, 93, 122, 0.22)",
  },
  breadcrumb: {
    shell: "linear-gradient(180deg, #7cb9ff 0%, #60a7fa 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(53, 95, 173, 0.2)",
  },
  filtres: {
    shell: "linear-gradient(180deg, #5889ff 0%, #4475eb 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(42, 69, 150, 0.22)",
  },
  grille: {
    shell: "linear-gradient(180deg, #4c8ef5 0%, #3a7ee7 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(35, 78, 161, 0.2)",
  },
  contenu: {
    shell: "linear-gradient(180deg, #4f96ff 0%, #327be2 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(32, 72, 151, 0.22)",
  },
  sidebar: {
    shell: "linear-gradient(180deg, #55b6f1 0%, #3899da 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(31, 97, 144, 0.2)",
  },
  form: {
    shell: "linear-gradient(180deg, #ff8198 0%, #ef627e 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(161, 53, 78, 0.22)",
  },
  submit: {
    shell: "linear-gradient(180deg, #a86ff7 0%, #8f59e5 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(84, 42, 145, 0.22)",
  },
  titre: {
    shell: "linear-gradient(180deg, #5b8eff 0%, #4677ec 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(43, 68, 149, 0.2)",
  },
  arguments: {
    shell: "linear-gradient(180deg, #ff8f73 0%, #ef6f52 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(157, 67, 48, 0.22)",
  },
  "social-proof": {
    shell: "linear-gradient(180deg, #7c9bff 0%, #6181f0 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(55, 73, 145, 0.2)",
  },
  progression: {
    shell: "linear-gradient(180deg, #67bbff 0%, #469fe8 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(40, 103, 154, 0.2)",
  },
  question: {
    shell: "linear-gradient(180deg, #5f8dfd 0%, #4674e4 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(43, 67, 150, 0.22)",
  },
  reponses: {
    shell: "linear-gradient(180deg, #4e8bff 0%, #3773e2 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(33, 73, 152, 0.22)",
  },
  navigation: {
    shell: "linear-gradient(180deg, #7393ff 0%, #5d7ce9 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(57, 73, 142, 0.2)",
  },
  "search-bar": {
    shell: "linear-gradient(180deg, #39d2bd 0%, #24b8a6 100%)",
    header: "rgba(255,255,255,0.14)",
    border: "rgba(18, 112, 102, 0.22)",
  },
  resultats: {
    shell: "linear-gradient(180deg, #4a8ff7 0%, #3678df 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(31, 74, 151, 0.22)",
  },
  pagination: {
    shell: "linear-gradient(180deg, #99aac5 0%, #8193af 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(80, 92, 115, 0.22)",
  },
  image: {
    shell: "linear-gradient(180deg, #6fb7ff 0%, #4a98e7 100%)",
    header: "rgba(255,255,255,0.12)",
    border: "rgba(45, 100, 152, 0.22)",
  },
};

const DEFAULT_SECTION_STYLE = {
  shell: "linear-gradient(180deg, #4a8cf4 0%, #346fd7 100%)",
  header: "rgba(255,255,255,0.12)",
  border: "rgba(29, 64, 130, 0.22)",
};

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
  const pageType = PAGE_TYPE_CONFIG[data.type];
  const priority = PRIORITY_CONFIG[data.priority];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
      {/* Side handles for cross-links */}
      <Handle id="left" type="target" position={Position.Left} className="!opacity-0 !w-0 !h-0" />
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0 !w-0 !h-0" />

      <div
        className={cn(
          "rounded-[20px] overflow-hidden cursor-pointer border",
          "transition-all duration-200 ease-out",
          "hover:translate-y-[-2px]",
          "active:translate-y-[0px]",
          data.priority === "utility" && !selected && "opacity-50",
        )}
        style={{
          width: CARD_WIDTH,
          height: cardH,
          background:
            "linear-gradient(180deg, rgba(250,252,255,0.98) 0%, rgba(241,246,255,0.98) 100%)",
          borderColor: selected ? "var(--accent)" : "rgba(109, 144, 201, 0.55)",
          boxShadow: selected
            ? "0 18px 36px rgba(20, 53, 110, 0.26), 0 0 0 1px rgba(255,255,255,0.45) inset"
            : "0 16px 30px rgba(14, 30, 64, 0.2), 0 0 0 1px rgba(255,255,255,0.7) inset",
        }}
      >
        <div
          className="px-[8px] pt-[6px] pb-[5px] border-b"
          style={{
            height: TITLE_HEIGHT,
            borderColor: "rgba(95, 127, 184, 0.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(236,243,255,0.78) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-[4px] mb-[4px]">
            <span
              className="px-[4px] py-[1px] rounded-full text-[4.5px] font-semibold uppercase tracking-[0.18em]"
              style={{
                color: "var(--accent)",
                background: "rgba(59, 113, 225, 0.1)",
              }}
            >
              {pageType.label}
            </span>
            <span
              className="px-[4px] py-[1px] rounded-full text-[4.5px] font-semibold uppercase tracking-[0.18em]"
              style={{
                color: "rgba(58, 74, 104, 0.9)",
                background:
                  data.priority === "primary"
                    ? "rgba(46, 204, 113, 0.16)"
                    : data.priority === "secondary"
                      ? "rgba(59, 113, 225, 0.12)"
                      : "rgba(120, 130, 150, 0.14)",
              }}
            >
              {priority.label}
            </span>
          </div>
          <p
            className="text-[10px] font-bold leading-none truncate text-center w-full"
            style={{
              color: "var(--accent)",
              letterSpacing: "-0.02em",
            }}
          >
            {data.label}
          </p>
        </div>

        {sections.map((section, i) => {
          const Skin = SKIN_MAP[section.skin] || SkinDefault;
          const sectionStyle = SECTION_STYLES[section.skin] || DEFAULT_SECTION_STYLE;
          const sectionHeight = getSectionHeight(section);
          const bodyHeight = Math.max(sectionHeight - SECTION_HEADER_HEIGHT - 2, 6);

          return (
            <div
              key={i}
              className="relative overflow-hidden border"
              style={{
                height: sectionHeight,
                marginTop: SECTION_GAP,
                marginLeft: CARD_PAD,
                marginRight: CARD_PAD,
                borderRadius: 8,
                background: sectionStyle.shell,
                borderColor: sectionStyle.border,
                boxShadow: section.accent
                  ? "0 6px 14px rgba(16, 42, 89, 0.14)"
                  : "0 3px 8px rgba(16, 42, 89, 0.08)",
              }}
            >
              <div
                className="flex items-center px-[5px] border-b"
                style={{
                  height: SECTION_HEADER_HEIGHT,
                  background: sectionStyle.header,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <span
                  className="text-white/95 leading-none select-none pointer-events-none font-semibold truncate"
                  style={{ fontSize: "5.4px", letterSpacing: "-0.01em" }}
                >
                  {section.label}
                </span>
              </div>
              <div
                className="relative overflow-hidden"
                style={{
                  height: bodyHeight,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <Skin />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default memo(SiteNodeComponent);
