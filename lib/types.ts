// ─── Page & Zoning types ─────────────────────────────────────────────────────

// Built-in page types (kept for backwards compat + PAGE_TYPE_CONFIG)
export const BUILT_IN_PAGE_TYPES = [
  'home', 'listing', 'detail', 'form', 'landing', 'quiz', 'search', 'hub', 'error', 'legal'
] as const

export type BuiltInPageType = typeof BUILT_IN_PAGE_TYPES[number]

// PageType is now a free string — IA can invent any type
export type PageType = string

/** @deprecated Kept for migration only */
export type ZoningType =
  | 'home'
  | 'listing'
  | 'detail'
  | 'form'
  | 'landing'
  | 'quiz'
  | 'search'
  | 'custom'

export type Priority = 'primary' | 'secondary' | 'utility'

export type EntryPointType = 'google' | 'direct' | 'nav' | 'social' | 'email' | 'ads' | 'qrcode'

export interface EntryPoint {
  type: EntryPointType
  label: string
}

// ─── Zoning blocks ──────────────────────────────────────────────────────────

export interface ZoningBlock {
  id: string
  label: string
  skin: string
  height: number
}

// ─── Wireframe annotations ──────────────────────────────────────────────────

export type AnnotationTag = 'UX' | 'COPY' | 'SEO' | 'DEV' | 'DESIGN' | 'A11Y' | 'PERF' | 'TODO'

export const ANNOTATION_TAG_CONFIG: Record<AnnotationTag, { label: string; color: string }> = {
  UX:     { label: 'UX',      color: '#8B5CF6' },
  COPY:   { label: 'Copy',    color: '#3B82F6' },
  SEO:    { label: 'SEO',     color: '#10B981' },
  DEV:    { label: 'Dev',     color: '#F59E0B' },
  DESIGN: { label: 'Design',  color: '#EC4899' },
  A11Y:   { label: 'A11y',    color: '#6366F1' },
  PERF:   { label: 'Perf',    color: '#EF4444' },
  TODO:   { label: 'Todo',    color: '#6B7280' },
}

export interface WireframeAnnotation {
  id: string
  section: string
  tag: AnnotationTag
  title: string
  body: string
}

// ─── Node data (stored as JSON blob in SQLite `data` column) ─────────────────

export interface NodeData {
  label: string
  type: PageType
  priority: Priority
  description?: string
  notes?: string
  rationale?: string
  cta?: string[]
  tags?: string[]
  group?: string
  /** Layout of this node's direct children on the canvas. 'spread' (default) = ELK left-right; 'stack' = single column; 'grid' = packed grid of `childCols` columns. */
  childLayout?: 'spread' | 'stack' | 'grid'
  /** Number of columns when childLayout === 'grid' (2-6). 'stack' is always 1. */
  childCols?: number
  entryPoints?: EntryPoint[]
  links?: string[]
  estimate?: number
  zoningBlocks?: ZoningBlock[]
  zoningExpanded?: boolean
  zoningHtml?: string
  /** What to show on the canvas: 'zoning' (block bricks), 'wireframe' (HTML preview), or undefined (hidden) */
  zoningCanvasMode?: 'zoning' | 'wireframe'
  annotations?: WireframeAnnotation[]
  /** @deprecated Kept for migration — use zoningBlocks */
  zoning?: ZoningType
  // Multi-parent: additional parent IDs (node appears under primary parent in layout,
  // but draws edges from these secondary parents too)
  secondaryParentIds?: string[]
  // IA metadata
  lastModifiedBy?: 'human' | 'ai'
  lastModifiedByName?: string
}

// ─── SiteNode — runtime representation (after DB fetch) ──────────────────────

export interface SiteNode extends NodeData {
  id: string
  children: string[]      // Computed from DB parent_id relationships
  position?: number
  readOnly?: boolean       // Injected at render time for guest/viewer mode
}

// ─── Global sections (shared across wireframes) ─────────────────────────────

export interface GlobalSection {
  id: string
  /** Slot: where this section appears. 'header'/'footer' are auto-injected. Custom slots are passed to the AI as reference. */
  slot: 'header' | 'footer' | 'component'
  /** Display name (e.g. "Header", "Footer", "Stepper", "Sidebar panier") */
  name: string
  /** The responsive HTML content for this section */
  html: string
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type WireframeFidelity = 'lo-fi' | 'mid-fi' | 'hi-fi'

export const WIREFRAME_FIDELITY_CONFIG: Record<WireframeFidelity, { label: string; description: string }> = {
  'lo-fi':  { label: 'Lo-fi',  description: 'Gris uniquement, blocs simples, pas de details visuels' },
  'mid-fi': { label: 'Mid-fi', description: 'Couleurs neutres, typographie realiste, composants detailles' },
  'hi-fi':  { label: 'Hi-fi',  description: 'Proche du rendu final, couleurs, images placeholder realistes' },
}

export const WIREFRAME_FONT_PRESETS = [
  'Inter',
  'DM Sans',
  'Plus Jakarta Sans',
  'Poppins',
  'Manrope',
  'Space Grotesk',
  'Outfit',
  'Sora',
  'Geist',
  'Libre Franklin',
  'IBM Plex Sans',
  'Source Sans 3',
  'Nunito Sans',
  'Rubik',
  'Work Sans',
] as const

export type ShareView = 'both' | 'sitemap' | 'wireframe'

/** Whether the project is a website (pages with URLs) or a mobile/web app (screens, flows) */
export type ProjectMode = 'website' | 'app'

export const PROJECT_MODE_CONFIG: Record<ProjectMode, { label: string; description: string }> = {
  website: { label: 'Site web', description: 'Pages avec URLs, parcours SEO, desktop-first' },
  app:     { label: 'Application', description: 'Écrans mobiles/web app, flows, navigation tab/stack' },
}

export interface WireframeSettings {
  /** Whether guests (share links) can see wireframes — legacy, use shareView instead */
  guestVisible: boolean
  /** What guests can see: sitemap only, wireframe only, or both */
  shareView: ShareView
  /** Whether guests can download the PDF export */
  guestCanExport: boolean
  /** Google Font family used in wireframes */
  font: string
  /** Wireframe fidelity level */
  fidelity: WireframeFidelity
}

export const DEFAULT_WIREFRAME_SETTINGS: WireframeSettings = {
  guestVisible: true,
  shareView: 'both',
  guestCanExport: false,
  font: 'Inter',
  fidelity: 'lo-fi',
}

export interface Project {
  id: string
  slug: string
  name: string
  client: string
  version: string
  date: string            // ISO string (from created_at)
  accent: string
  password?: string       // Guest share link password — NOT stored on project anymore
  nodes: SiteNode[]
  ownerId?: string
  workspaceId?: string | null
  updatedAt?: number
  globalSections?: GlobalSection[]
  wireframeSettings?: WireframeSettings
  /** Site web or application — shapes AI prompts */
  mode?: ProjectMode
  /** Freeform memory of the project (brief, preferences, constraints). Enriched by AI over time. */
  context?: string
}

// ─── User ────────────────────────────────────────────────────────────────────

export type GlobalRole = 'user' | 'admin'
export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  emailVerified: boolean
  name: string
  color: string
  roleGlobal: GlobalRole
  createdAt: number
}

// ─── Presence ────────────────────────────────────────────────────────────────

export interface PresenceUser {
  id: string
  displayName: string
  role: ProjectRole | 'guest'
  color: string
  avatarUrl: string | null
  activeNodeId: string | null
  isAI: boolean
  lastSeen: number
}

// ─── UI Config (unchanged) ───────────────────────────────────────────────────

export const PAGE_TYPE_CONFIG: Record<BuiltInPageType, { icon: string; label: string }> = {
  home:    { icon: 'Home',          label: 'Accueil' },
  listing: { icon: 'LayoutGrid',    label: 'Listing' },
  detail:  { icon: 'FileText',      label: 'Détail' },
  form:    { icon: 'PenLine',       label: 'Formulaire' },
  landing: { icon: 'Sparkles',      label: 'Landing' },
  quiz:    { icon: 'HelpCircle',    label: 'Quiz' },
  search:  { icon: 'Search',        label: 'Recherche' },
  hub:     { icon: 'Layers',        label: 'Hub' },
  error:   { icon: 'AlertTriangle', label: 'Erreur' },
  legal:   { icon: 'Scale',         label: 'Légal' },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string }> = {
  primary:   { label: 'Principale' },
  secondary: { label: 'Secondaire' },
  utility:   { label: 'Utilitaire' },
}

/** Returns the display label for any page type (built-in or custom) */
export function getPageTypeLabel(type: PageType, customLabel?: string): string {
  if (type in PAGE_TYPE_CONFIG) {
    return PAGE_TYPE_CONFIG[type as BuiltInPageType].label
  }
  return customLabel || type
}

// ─── Zoning block catalog & migration ────────────────────────────────────────

export const SKIN_CATALOG: { skin: string; label: string; height: number }[] = [
  { skin: 'nav', label: 'Navigation', height: 18 },
  { skin: 'hero', label: 'Hero', height: 64 },
  { skin: 'breadcrumb', label: 'Breadcrumb', height: 14 },
  { skin: 'titre', label: 'Titre', height: 20 },
  { skin: 'contenu', label: 'Contenu', height: 60 },
  { skin: 'sidebar', label: 'Sidebar', height: 36 },
  { skin: 'cards', label: 'Cards', height: 56 },
  { skin: 'grille', label: 'Grille', height: 56 },
  { skin: 'filtres', label: 'Filtres', height: 22 },
  { skin: 'cta', label: 'CTA', height: 28 },
  { skin: 'double-cta', label: 'Double CTA', height: 28 },
  { skin: 'form', label: 'Formulaire', height: 60 },
  { skin: 'submit', label: 'Envoi', height: 22 },
  { skin: 'arguments', label: 'Arguments', height: 42 },
  { skin: 'social-proof', label: 'Social proof', height: 28 },
  { skin: 'image', label: 'Image / Vidéo', height: 42 },
  { skin: 'question', label: 'Question', height: 28 },
  { skin: 'reponses', label: 'Réponses', height: 52 },
  { skin: 'progression', label: 'Progression', height: 14 },
  { skin: 'nav-quiz', label: 'Nav quiz', height: 18 },
  { skin: 'search-bar', label: 'Recherche', height: 22 },
  { skin: 'resultats', label: 'Résultats', height: 56 },
  { skin: 'pagination', label: 'Pagination', height: 16 },
  { skin: 'footer', label: 'Footer', height: 20 },
  { skin: 'dots', label: '...', height: 10 },
]

let _blockIdCounter = 0
export function generateBlockId(): string {
  return `zb_${Date.now().toString(36)}_${(++_blockIdCounter).toString(36)}`
}

const LEGACY_ZONING_MAP: Record<string, ZoningBlock[]> = {
  home: [
    { id: 'mig_1', label: 'Métiers — Formations', skin: 'double-cta', height: 28 },
    { id: 'mig_2', label: 'Bloc vidéo', skin: 'image', height: 42 },
    { id: 'mig_3', label: 'Bloc quiz', skin: 'question', height: 20 },
    { id: 'mig_4', label: '...', skin: 'dots', height: 10 },
  ],
  listing: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Breadcrumb', skin: 'breadcrumb', height: 14 },
    { id: 'mig_3', label: 'Filtres', skin: 'filtres', height: 22 },
    { id: 'mig_4', label: 'Grille', skin: 'grille', height: 56 },
    { id: 'mig_5', label: 'Pagination', skin: 'pagination', height: 16 },
    { id: 'mig_6', label: 'Footer', skin: 'footer', height: 20 },
  ],
  detail: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Breadcrumb', skin: 'breadcrumb', height: 14 },
    { id: 'mig_3', label: 'Contenu', skin: 'contenu', height: 60 },
    { id: 'mig_4', label: 'Sidebar', skin: 'sidebar', height: 36 },
    { id: 'mig_5', label: 'CTA', skin: 'cta', height: 28 },
    { id: 'mig_6', label: 'Footer', skin: 'footer', height: 20 },
  ],
  form: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Titre', skin: 'titre', height: 20 },
    { id: 'mig_3', label: 'Formulaire', skin: 'form', height: 60 },
    { id: 'mig_4', label: 'Envoi', skin: 'submit', height: 22 },
    { id: 'mig_5', label: 'Footer', skin: 'footer', height: 20 },
  ],
  landing: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Hero', skin: 'hero', height: 64 },
    { id: 'mig_3', label: 'Arguments', skin: 'arguments', height: 42 },
    { id: 'mig_4', label: 'Social proof', skin: 'social-proof', height: 28 },
    { id: 'mig_5', label: 'CTA', skin: 'cta', height: 28 },
    { id: 'mig_6', label: 'Footer', skin: 'footer', height: 20 },
  ],
  quiz: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Progression', skin: 'progression', height: 14 },
    { id: 'mig_3', label: 'Question', skin: 'question', height: 28 },
    { id: 'mig_4', label: 'Réponses', skin: 'reponses', height: 52 },
    { id: 'mig_5', label: 'Nav quiz', skin: 'nav-quiz', height: 18 },
    { id: 'mig_6', label: 'Footer', skin: 'footer', height: 20 },
  ],
  search: [
    { id: 'mig_1', label: 'Navigation', skin: 'nav', height: 18 },
    { id: 'mig_2', label: 'Recherche', skin: 'search-bar', height: 22 },
    { id: 'mig_3', label: 'Résultats', skin: 'resultats', height: 56 },
    { id: 'mig_4', label: 'Pagination', skin: 'pagination', height: 16 },
    { id: 'mig_5', label: 'Footer', skin: 'footer', height: 20 },
  ],
}

/** Migrate legacy zoning field to zoningBlocks */
export function migrateNodeZoning<T extends NodeData>(node: T): T {
  if (node.zoningBlocks) return node
  const legacyType = node.zoning
  if (legacyType && LEGACY_ZONING_MAP[legacyType]) {
    return {
      ...node,
      zoningBlocks: LEGACY_ZONING_MAP[legacyType].map((b, i) => ({
        ...b,
        id: generateBlockId() + '_' + i,
      })),
      zoningExpanded: legacyType === 'home',
    }
  }
  return node
}
