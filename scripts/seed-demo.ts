/**
 * Seed a demo project visible to all users.
 * Idempotent — skips if demo already exists.
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

// Check if demo already exists
const existing = db
  .prepare("SELECT id FROM projects WHERE slug = ?")
  .get(DEMO_PROJECT_SLUG);
if (existing) {
  console.log("\u2192 Demo project already exists, skipping");
  db.close();
  process.exit(0);
}

// We need a system user to own the demo project
let systemUserId: string;
const systemUser = db
  .prepare("SELECT id FROM users WHERE email = 'system@arbo.app'")
  .get() as { id: string } | undefined;

if (systemUser) {
  systemUserId = systemUser.id;
} else {
  systemUserId = nanoid();
  const hash = bcryptjs.hashSync(nanoid(32), 10); // Random password, can't login
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, email_verified, password_hash, name, color, role_global, created_at, updated_at)
     VALUES (?, 'system@arbo.app', 1, ?, 'Arbo', '#5E6AD2', 'admin', ?, ?)`
  ).run(systemUserId, hash, now, now);
  console.log("\u2713 System user created");
}

// Create demo project
const projectId = nanoid();
const now = Date.now();

db.prepare(
  `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, 'v1', ?, 0, ?, ?)`
).run(
  projectId,
  DEMO_PROJECT_SLUG,
  "E-commerce Sneakers",
  "SneakVault",
  "#F59E0B",
  systemUserId,
  now,
  now
);

db.prepare(
  `INSERT INTO project_members (project_id, user_id, role, added_at)
   VALUES (?, ?, 'owner', ?)`
).run(projectId, systemUserId, now);

// Insert demo nodes
const nodes = [
  { tid: "home", pid: null, label: "Accueil", type: "home", priority: "primary", desc: "Page d'entr\u00e9e avec hero, nouveaut\u00e9s et cat\u00e9gories" },
  { tid: "catalog", pid: "home", label: "Catalogue", type: "listing", priority: "primary", desc: "Grille produits avec filtres (marque, taille, prix)" },
  { tid: "product", pid: "catalog", label: "Fiche produit", type: "detail", priority: "primary", desc: "D\u00e9tail sneaker avec photos, tailles, avis" },
  { tid: "cart", pid: "home", label: "Panier", type: "detail", priority: "primary", desc: "R\u00e9cap commande avec modification quantit\u00e9s" },
  { tid: "checkout", pid: "cart", label: "Tunnel d'achat", type: "form", priority: "primary", desc: "Adresse, livraison, paiement en 3 \u00e9tapes" },
  { tid: "confirm", pid: "checkout", label: "Confirmation", type: "detail", priority: "secondary", desc: "Merci + r\u00e9cap commande + suivi" },
  { tid: "account", pid: "home", label: "Mon compte", type: "hub", priority: "secondary", desc: "Dashboard client : commandes, adresses, wishlist" },
  { tid: "orders", pid: "account", label: "Mes commandes", type: "listing", priority: "secondary", desc: "Historique et suivi des commandes" },
  { tid: "wishlist", pid: "account", label: "Wishlist", type: "listing", priority: "secondary", desc: "Sneakers sauv\u00e9es pour plus tard" },
  { tid: "blog", pid: "home", label: "Blog", type: "listing", priority: "secondary", desc: "Actus sneakers, guides d'achat, tendances" },
  { tid: "article", pid: "blog", label: "Article", type: "detail", priority: "secondary", desc: "Article de blog avec images et partage social" },
  { tid: "about", pid: "home", label: "\u00c0 propos", type: "detail", priority: "secondary", desc: "Histoire de la marque et engagements" },
  { tid: "contact", pid: "home", label: "Contact", type: "form", priority: "secondary", desc: "Formulaire de contact + FAQ rapide" },
  { tid: "faq", pid: "contact", label: "FAQ", type: "detail", priority: "utility", desc: "Questions fr\u00e9quentes : livraison, retours, tailles" },
  { tid: "search", pid: "home", label: "Recherche", type: "search", priority: "secondary", desc: "Recherche full-text avec suggestions et filtres" },
  { tid: "legal", pid: "home", label: "Mentions l\u00e9gales", type: "legal", priority: "utility", desc: "CGV, CGU, politique de confidentialit\u00e9" },
  { tid: "404", pid: "home", label: "Page 404", type: "error", priority: "utility", desc: "Page introuvable avec suggestions de navigation" },
];

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

    const data = JSON.stringify({
      label: node.label,
      type: node.type,
      priority: node.priority,
      description: node.desc,
      rationale: "Projet de d\u00e9monstration",
    });

    insertStmt.run(realId, projectId, parentId, posRow.next_pos, data, now, now);
  }
})();

console.log(`\u2713 Demo project created: ${projectId} (${nodes.length} pages)`);
console.log(`  Slug: ${DEMO_PROJECT_SLUG}`);

db.close();
