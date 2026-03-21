/**
 * Seed a demo project visible to all users.
 * Idempotent — re-seeds if demo already exists (deletes old, creates fresh).
 *
 * Run with: npx tsx scripts/seed-demo.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { nanoid } from "nanoid";
import bcryptjs from "bcryptjs";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "arbo.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const DEMO_PROJECT_SLUG = "demo-ecommerce";

// Delete old demo if exists
const existing = db
  .prepare("SELECT id FROM projects WHERE slug = ?")
  .get(DEMO_PROJECT_SLUG) as { id: string } | undefined;
if (existing) {
  db.prepare("DELETE FROM nodes WHERE project_id = ?").run(existing.id);
  db.prepare("DELETE FROM project_members WHERE project_id = ?").run(existing.id);
  db.prepare("DELETE FROM projects WHERE id = ?").run(existing.id);
  console.log("-> Old demo deleted, re-seeding");
}

// System user
let systemUserId: string;
const systemUser = db
  .prepare("SELECT id FROM users WHERE email = 'system@arbo.app'")
  .get() as { id: string } | undefined;

if (systemUser) {
  systemUserId = systemUser.id;
} else {
  systemUserId = nanoid();
  const hash = bcryptjs.hashSync(nanoid(32), 10);
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, email_verified, password_hash, name, color, role_global, created_at, updated_at)
     VALUES (?, 'system@arbo.app', 1, ?, 'Arbo', '#F76B15', 'admin', ?, ?)`
  ).run(systemUserId, hash, now, now);
  console.log("[ok] System user created");
}

// Create demo project
const projectId = nanoid();
const now = Date.now();

db.prepare(
  `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, 'v1', ?, 0, ?, ?)`
).run(projectId, DEMO_PROJECT_SLUG, "E-commerce Sneakers", "SneakVault", "#F59E0B", systemUserId, now, now);

db.prepare(
  `INSERT INTO project_members (project_id, user_id, role, added_at)
   VALUES (?, ?, 'owner', ?)`
).run(projectId, systemUserId, now);

// ─── Demo nodes with full data ──────────────────────────────────────────────

interface DemoNode {
  tid: string;
  pid: string | null;
  label: string;
  type: string;
  priority: "primary" | "secondary" | "utility";
  desc: string;
  rationale: string;
  cta?: string[];
  tags?: string[];
  entryPoints?: { type: string; label: string }[];
  zoningBlocks?: { id: string; label: string; skin: string; height: number }[];
  zoningExpanded?: boolean;
}

const nodes: DemoNode[] = [
  {
    tid: "home", pid: null, label: "Accueil", type: "home", priority: "primary",
    desc: "Page d'entr\u00E9e avec hero, nouveaut\u00E9s et cat\u00E9gories phares",
    rationale: "Point d'entr\u00E9e principal, doit convertir en exploration catalogue",
    cta: ["D\u00E9couvrir la collection", "Voir les nouveaut\u00E9s"],
    tags: ["SEO", "conversion", "branding"],
    entryPoints: [
      { type: "google", label: "Google (SEO)" },
      { type: "direct", label: "Acc\u00E8s direct" },
      { type: "social", label: "Instagram / TikTok" },
      { type: "ads", label: "Google Ads" },
    ],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Hero", skin: "hero", height: 64 },
      { id: "z3", label: "Nouveaut\u00E9s", skin: "cards", height: 56 },
      { id: "z4", label: "Cat\u00E9gories", skin: "grille", height: 56 },
      { id: "z5", label: "Marques partenaires", skin: "social-proof", height: 28 },
      { id: "z6", label: "Newsletter CTA", skin: "cta", height: 28 },
      { id: "z7", label: "Footer", skin: "footer", height: 20 },
    ],
    zoningExpanded: true,
  },
  {
    tid: "catalog", pid: "home", label: "Catalogue", type: "listing", priority: "primary",
    desc: "Grille produits avec filtres (marque, taille, prix, couleur)",
    rationale: "Page cl\u00E9 du parcours : exploration \u2192 fiche produit",
    cta: ["Ajouter au panier"],
    tags: ["SEO", "filtres", "pagination"],
    entryPoints: [
      { type: "google", label: "Google Shopping" },
      { type: "nav", label: "Navigation principale" },
    ],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Breadcrumb", skin: "breadcrumb", height: 14 },
      { id: "z3", label: "Filtres", skin: "filtres", height: 22 },
      { id: "z4", label: "Grille produits", skin: "grille", height: 56 },
      { id: "z5", label: "Pagination", skin: "pagination", height: 16 },
      { id: "z6", label: "Footer", skin: "footer", height: 20 },
    ],
    zoningExpanded: true,
  },
  {
    tid: "product", pid: "catalog", label: "Fiche produit", type: "detail", priority: "primary",
    desc: "D\u00E9tail sneaker : galerie photos, tailles, avis clients, produits similaires",
    rationale: "Page de conversion #1 : d\u00E9cision d'achat",
    cta: ["Ajouter au panier", "Ajouter \u00E0 la wishlist"],
    tags: ["SEO", "conversion", "avis", "schema.org"],
    entryPoints: [
      { type: "google", label: "Google (fiche produit)" },
      { type: "social", label: "Partage social" },
    ],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Breadcrumb", skin: "breadcrumb", height: 14 },
      { id: "z3", label: "Galerie + infos", skin: "contenu", height: 60 },
      { id: "z4", label: "S\u00E9lecteur taille", skin: "form", height: 60 },
      { id: "z5", label: "Ajouter au panier", skin: "cta", height: 28 },
      { id: "z6", label: "Avis clients", skin: "social-proof", height: 28 },
      { id: "z7", label: "Produits similaires", skin: "cards", height: 56 },
      { id: "z8", label: "Footer", skin: "footer", height: 20 },
    ],
    zoningExpanded: true,
  },
  {
    tid: "cart", pid: "home", label: "Panier", type: "detail", priority: "primary",
    desc: "R\u00E9cap commande, modification quantit\u00E9s, code promo",
    rationale: "\u00C9tape cl\u00E9 du tunnel : r\u00E9duire l'abandon de panier",
    cta: ["Commander", "Continuer mes achats"],
    tags: ["conversion", "abandon panier"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Liste articles", skin: "contenu", height: 60 },
      { id: "z3", label: "Code promo", skin: "form", height: 60 },
      { id: "z4", label: "Total + Commander", skin: "double-cta", height: 28 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "checkout", pid: "cart", label: "Tunnel d'achat", type: "form", priority: "primary",
    desc: "3 \u00E9tapes : adresse, livraison, paiement (Stripe)",
    rationale: "Tunnel simplifi\u00E9 pour maximiser la conversion",
    cta: ["Valider et payer"],
    tags: ["conversion", "paiement", "Stripe"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Progression", skin: "progression", height: 14 },
      { id: "z3", label: "Formulaire", skin: "form", height: 60 },
      { id: "z4", label: "R\u00E9cap commande", skin: "sidebar", height: 36 },
      { id: "z5", label: "Valider", skin: "cta", height: 28 },
    ],
  },
  {
    tid: "confirm", pid: "checkout", label: "Confirmation", type: "detail", priority: "secondary",
    desc: "Page de remerciement + r\u00E9cap + num\u00E9ro de suivi",
    rationale: "Rassurer le client, encourager le partage et le retour",
    cta: ["Suivre ma commande", "Retour \u00E0 l'accueil"],
    tags: ["post-achat", "tracking"],
  },
  {
    tid: "account", pid: "home", label: "Mon compte", type: "hub", priority: "secondary",
    desc: "Dashboard client : commandes, adresses, wishlist, param\u00E8tres",
    rationale: "Espace personnel pour fid\u00E9liser et faciliter le r\u00E9-achat",
    tags: ["auth", "espace client"],
    entryPoints: [
      { type: "email", label: "Email transactionnel" },
      { type: "nav", label: "Navigation (ic\u00F4ne compte)" },
    ],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Sidebar compte", skin: "sidebar", height: 36 },
      { id: "z3", label: "Contenu principal", skin: "contenu", height: 60 },
      { id: "z4", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "orders", pid: "account", label: "Mes commandes", type: "listing", priority: "secondary",
    desc: "Historique et suivi des commandes avec statut en temps r\u00E9el",
    rationale: "R\u00E9duire les appels SAV en rendant le suivi autonome",
    tags: ["espace client", "suivi"],
  },
  {
    tid: "wishlist", pid: "account", label: "Wishlist", type: "listing", priority: "secondary",
    desc: "Sneakers sauv\u00E9es pour plus tard, partage de liste",
    rationale: "Engagement long terme, facilite le retour et la conversion diff\u00E9r\u00E9e",
    cta: ["Ajouter au panier"],
    tags: ["engagement", "conversion"],
  },
  {
    tid: "blog", pid: "home", label: "Blog", type: "listing", priority: "secondary",
    desc: "Actus sneakers, guides d'achat, tendances, drops \u00E0 venir",
    rationale: "SEO + notori\u00E9t\u00E9 : attirer du trafic organique qualifi\u00E9",
    tags: ["SEO", "content marketing"],
    entryPoints: [
      { type: "google", label: "Google (articles)" },
      { type: "social", label: "R\u00E9seaux sociaux" },
    ],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Article \u00E0 la une", skin: "hero", height: 64 },
      { id: "z3", label: "Grille articles", skin: "cards", height: 56 },
      { id: "z4", label: "Pagination", skin: "pagination", height: 16 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "article", pid: "blog", label: "Article", type: "detail", priority: "secondary",
    desc: "Article de blog avec images, partage social, articles li\u00E9s",
    rationale: "Contenu SEO long-tail + engagement communaut\u00E9",
    cta: ["Voir les produits cit\u00E9s"],
    tags: ["SEO", "content"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Titre + image", skin: "hero", height: 64 },
      { id: "z3", label: "Contenu article", skin: "contenu", height: 60 },
      { id: "z4", label: "Produits li\u00E9s", skin: "cards", height: 56 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "about", pid: "home", label: "\u00C0 propos", type: "detail", priority: "secondary",
    desc: "Histoire de SneakVault, \u00E9quipe, engagements qualit\u00E9 et authenticit\u00E9",
    rationale: "Construire la confiance, storytelling de marque",
    tags: ["branding", "confiance"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Hero marque", skin: "hero", height: 64 },
      { id: "z3", label: "Notre histoire", skin: "contenu", height: 60 },
      { id: "z4", label: "Engagements", skin: "arguments", height: 42 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "contact", pid: "home", label: "Contact", type: "form", priority: "secondary",
    desc: "Formulaire de contact + horaires + plan + lien FAQ",
    rationale: "Dernier recours avant abandon, r\u00E9duire la friction SAV",
    cta: ["Envoyer le message"],
    tags: ["SAV", "confiance"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Titre + intro", skin: "titre", height: 20 },
      { id: "z3", label: "Formulaire", skin: "form", height: 60 },
      { id: "z4", label: "Envoyer", skin: "submit", height: 22 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "faq", pid: "contact", label: "FAQ", type: "detail", priority: "utility",
    desc: "Questions fr\u00E9quentes : livraison, retours, tailles, authenticit\u00E9",
    rationale: "D\u00E9charger le SAV, rassurer avant achat",
    tags: ["SEO", "SAV", "confiance"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Recherche FAQ", skin: "search-bar", height: 22 },
      { id: "z3", label: "Questions / R\u00E9ponses", skin: "contenu", height: 60 },
      { id: "z4", label: "Contact CTA", skin: "cta", height: 28 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "search", pid: "home", label: "Recherche", type: "search", priority: "secondary",
    desc: "Recherche full-text avec suggestions auto et filtres actifs",
    rationale: "Raccourci direct vers le produit pour les visiteurs d\u00E9cid\u00E9s",
    tags: ["UX", "conversion"],
    zoningBlocks: [
      { id: "z1", label: "Navigation", skin: "nav", height: 18 },
      { id: "z2", label: "Barre de recherche", skin: "search-bar", height: 22 },
      { id: "z3", label: "R\u00E9sultats", skin: "resultats", height: 56 },
      { id: "z4", label: "Pagination", skin: "pagination", height: 16 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
  },
  {
    tid: "legal", pid: "home", label: "Mentions l\u00E9gales", type: "legal", priority: "utility",
    desc: "CGV, CGU, politique de confidentialit\u00E9, cookies",
    rationale: "Obligations l\u00E9gales RGPD + e-commerce",
    tags: ["l\u00E9gal", "RGPD"],
  },
  {
    tid: "404", pid: "home", label: "Page 404", type: "error", priority: "utility",
    desc: "Page introuvable avec suggestions de navigation et recherche",
    rationale: "R\u00E9cup\u00E9rer les visiteurs perdus au lieu de les perdre",
    cta: ["Retour \u00E0 l'accueil", "Rechercher"],
    tags: ["UX", "r\u00E9cup\u00E9ration"],
  },
];

// Insert nodes
const tempToReal = new Map<string, string>();
const insertStmt = db.prepare(
  `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
   VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
);

db.transaction(() => {
  for (const node of nodes) {
    const realId = nanoid();
    tempToReal.set(node.tid, realId);

    const parentId = node.pid ? tempToReal.get(node.pid) || null : null;

    const posRow = db
      .prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
      )
      .get(projectId, parentId) as { next_pos: number };

    const data: Record<string, unknown> = {
      label: node.label,
      type: node.type,
      priority: node.priority,
      description: node.desc,
      rationale: node.rationale,
    };
    if (node.cta) data.cta = node.cta;
    if (node.tags) data.tags = node.tags;
    if (node.entryPoints) data.entryPoints = node.entryPoints;
    if (node.zoningBlocks) {
      data.zoningBlocks = node.zoningBlocks;
      data.zoningExpanded = node.zoningExpanded ?? false;
    }

    insertStmt.run(realId, projectId, parentId, posRow.next_pos, JSON.stringify(data), now, now);
  }
})();

console.log(`[ok] Demo project created: ${projectId} (${nodes.length} pages)`);
console.log(`  Slug: ${DEMO_PROJECT_SLUG}`);
console.log(`  Zoning: ${nodes.filter(n => n.zoningBlocks).length} pages with zoning blocks`);
console.log(`  Entry points: ${nodes.filter(n => n.entryPoints).length} pages with entry points`);

db.close();
