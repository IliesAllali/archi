export type PageType =
  | "home"
  | "listing"
  | "detail"
  | "form"
  | "landing"
  | "quiz"
  | "search"
  | "error"
  | "legal";

export type ZoningType =
  | "home"
  | "listing"
  | "detail"
  | "form"
  | "landing"
  | "quiz"
  | "search";

export type Priority = "primary" | "secondary" | "utility";

export type EntryPointType = "google" | "direct" | "nav" | "social" | "email" | "ads" | "qrcode";

export interface EntryPoint {
  type: EntryPointType;
  label: string;
}

export interface SiteNode {
  id: string;
  label: string;
  type: PageType;
  priority: Priority;
  description: string;
  notes?: string;
  rationale?: string;
  zoning: ZoningType;
  estimate?: number;
  cta?: string[];
  tags?: string[];
  children: string[];
  entryPoints?: EntryPoint[];
}

export interface Project {
  id: string;
  name: string;
  client: string;
  version: string;
  date: string;
  accent: string;
  password?: string;
  nodes: SiteNode[];
}

export const PAGE_TYPE_CONFIG: Record<PageType, { icon: string; label: string }> = {
  home: { icon: "Home", label: "Accueil" },
  listing: { icon: "LayoutGrid", label: "Listing" },
  detail: { icon: "FileText", label: "Détail" },
  form: { icon: "PenLine", label: "Formulaire" },
  landing: { icon: "Sparkles", label: "Landing" },
  quiz: { icon: "HelpCircle", label: "Quiz" },
  search: { icon: "Search", label: "Recherche" },
  error: { icon: "AlertTriangle", label: "Erreur" },
  legal: { icon: "Scale", label: "Légal" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string }> = {
  primary: { label: "Principale" },
  secondary: { label: "Secondaire" },
  utility: { label: "Utilitaire" },
};
