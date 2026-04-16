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
  zoningHtml?: string;
  zoningCanvasMode?: "zoning" | "wireframe";
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
    zoningCanvasMode: "wireframe",
    zoningHtml: `<html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#1a1a1a}section{border-bottom:1px solid #e5e5e5}</style></head><body>
<div style="background:#1a1a1a;color:#fff;text-align:center;padding:8px;font-size:11px">Livraison offerte d\u00E8s 100\u20AC \u2014 Retours gratuits 30 jours</div>
<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid #e5e5e5">
  <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px">SneakVault</div>
  <div style="display:flex;gap:28px;font-size:13px;color:#555;font-weight:500"><span>Catalogue</span><span>Nouveaut\u00E9s</span><span>Marques</span><span>Blog</span><span>\u00C0 propos</span></div>
  <div style="display:flex;gap:20px;align-items:center;font-size:13px;color:#555"><span>\u{1F50D}</span><span>\u{1F464}</span><span style="position:relative">\u{1F6D2}<span style="position:absolute;top:-6px;right:-8px;background:#e53935;color:#fff;font-size:9px;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center">2</span></span></div>
</nav>
<section style="display:flex;min-height:520px;background:#f7f7f5">
  <div style="flex:1;padding:80px 48px;display:flex;flex-direction:column;justify-content:center">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:16px;font-weight:600">Collection printemps 2026</p>
    <h1 style="font-size:48px;font-weight:800;letter-spacing:-1.5px;line-height:1.05;margin-bottom:20px">Les sneakers<br/>qui changent<br/>la rue.</h1>
    <p style="font-size:15px;color:#666;max-width:380px;line-height:1.6;margin-bottom:36px">S\u00E9lection pointue de plus de 200 mod\u00E8les. Authenticit\u00E9 garantie. Livraison express 24h.</p>
    <div style="display:flex;gap:12px">
      <button style="padding:14px 32px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">D\u00E9couvrir la collection</button>
      <button style="padding:14px 32px;background:transparent;color:#1a1a1a;border:1.5px solid #d4d4d4;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Voir les nouveaut\u00E9s</button>
    </div>
  </div>
  <div style="flex:1;background:#ececea;display:flex;align-items:center;justify-content:center;min-height:520px">
    <div style="width:320px;height:320px;background:#ddd;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:13px">Image produit hero</div>
  </div>
</section>
<section style="padding:20px 48px;display:flex;justify-content:center;gap:48px;background:#fafaf8">
  ${[{i:"\u{1F69A}",t:"Livraison 24h",s:"Offerte d\u00E8s 100\u20AC"},{i:"\u{1F504}",t:"Retours gratuits",s:"30 jours pour changer d'avis"},{i:"\u2705",t:"100% authentique",s:"Chaque paire v\u00E9rifi\u00E9e"},{i:"\u{1F512}",t:"Paiement s\u00E9curis\u00E9",s:"Visa, Mastercard, Apple Pay"}].map(v => `<div style="display:flex;align-items:center;gap:12px;padding:16px 0"><span style="font-size:22px">${v.i}</span><div><p style="font-size:12px;font-weight:700">${v.t}</p><p style="font-size:11px;color:#999">${v.s}</p></div></div>`).join("")}
</section>
<section style="padding:64px 48px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:32px">
    <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.5px">Nouveaut\u00E9s</h2>
    <a style="font-size:12px;color:#555;font-weight:600;text-decoration:none">Tout voir \u2192</a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
    ${[{n:"Nike Air Max 90",c:"Retro running",p:"149"},{n:"New Balance 550",c:"Lifestyle",p:"129"},{n:"Adidas Samba OG",c:"Heritage",p:"110"},{n:"Puma Suede XL",c:"Skateboard",p:"89"}].map(s => `<div style="cursor:pointer"><div style="background:#f0f0f0;border-radius:10px;aspect-ratio:1;margin-bottom:14px;position:relative"><span style="position:absolute;top:10px;left:10px;background:#e53935;color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px">NEW</span></div><p style="font-size:13px;font-weight:700">${s.n}</p><p style="font-size:11px;color:#999;margin-top:2px">${s.c}</p><p style="font-size:15px;font-weight:800;margin-top:6px">${s.p} \u20AC</p></div>`).join("")}
  </div>
</section>
<section style="padding:64px 48px;background:#f7f7f5">
  <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:32px">Par cat\u00E9gorie</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
    ${[{n:"Running",c:"64 mod\u00E8les"},{n:"Lifestyle",c:"89 mod\u00E8les"},{n:"Skateboard",c:"31 mod\u00E8les"},{n:"Basketball",c:"42 mod\u00E8les"}].map(c => `<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;cursor:pointer"><div style="background:#ececea;height:140px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px">Image</div><div style="padding:16px"><p style="font-size:14px;font-weight:700">${c.n}</p><p style="font-size:11px;color:#999;margin-top:2px">${c.c}</p></div></div>`).join("")}
  </div>
</section>
<section style="padding:64px 48px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:32px">
    <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.5px">Best-sellers</h2>
    <a style="font-size:12px;color:#555;font-weight:600;text-decoration:none">Tout voir \u2192</a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
    ${[{n:"Nike Dunk Low",p:"119",v:"1 247 ventes"},{n:"Adidas Gazelle",p:"99",v:"983 ventes"},{n:"NB 2002R",p:"159",v:"876 ventes"},{n:"Asics Gel-1130",p:"129",v:"654 ventes"}].map(s => `<div><div style="background:#f0f0f0;border-radius:10px;aspect-ratio:1;margin-bottom:14px"></div><p style="font-size:13px;font-weight:700">${s.n}</p><p style="font-size:11px;color:#999;margin-top:2px">${s.v}</p><p style="font-size:15px;font-weight:800;margin-top:6px">${s.p} \u20AC</p></div>`).join("")}
  </div>
</section>
<section style="padding:48px;background:#f7f7f5">
  <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:12px;text-align:center;font-weight:600">Nos marques partenaires</p>
  <div style="display:flex;justify-content:center;gap:48px;align-items:center;padding:16px 0">
    ${["Nike","Adidas","New Balance","Puma","Asics","Reebok","Converse"].map(b => `<span style="color:#ccc;font-size:15px;font-weight:700">${b}</span>`).join("")}
  </div>
</section>
<section style="padding:64px 48px">
  <h2 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:8px;text-align:center">Ce qu'ils en disent</h2>
  <p style="font-size:13px;color:#999;text-align:center;margin-bottom:36px">Plus de 2 000 clients satisfaits</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
    ${[{n:"Thomas L.",s:5,t:"Commande re\u00E7ue en moins de 24h. La paire est parfaite, emballage soign\u00E9."},{n:"Marie D.",s:5,t:"Enfin un site avec une s\u00E9lection pointue et des vrais conseils de taille."},{n:"Julien R.",s:4,t:"Tr\u00E8s bon rapport qualit\u00E9/prix. Le retour gratuit c'est un vrai plus."}].map(r => `<div style="padding:24px;background:#fafafa;border-radius:10px;border:1px solid #f0f0f0"><div style="margin-bottom:12px;color:#f59e0b;font-size:12px">${"\u2605".repeat(r.s)}</div><p style="font-size:12px;color:#555;line-height:1.6;margin-bottom:16px">"${r.t}"</p><p style="font-size:12px;font-weight:700">${r.n}</p></div>`).join("")}
  </div>
</section>
<section style="padding:64px 48px;text-align:center;background:#1a1a1a;color:#fff">
  <h3 style="font-size:22px;font-weight:800;margin-bottom:8px">Reste dans la boucle</h3>
  <p style="font-size:13px;color:#999;margin-bottom:28px">Nouveaux drops, restocks, promos exclusives. Pas de spam.</p>
  <div style="display:flex;gap:8px;justify-content:center;max-width:440px;margin:0 auto">
    <input style="flex:1;padding:12px 16px;border:1px solid #333;border-radius:8px;font-size:13px;background:#111;color:#fff" placeholder="ton@email.com" />
    <button style="padding:12px 24px;background:#fff;color:#1a1a1a;border:none;border-radius:8px;font-size:13px;font-weight:700">S'inscrire</button>
  </div>
</section>
<footer style="padding:48px;background:#fafaf8;border-top:1px solid #e5e5e5">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;margin-bottom:32px">
    <div><p style="font-size:14px;font-weight:800;margin-bottom:16px">SneakVault</p><p style="font-size:11px;color:#999;line-height:1.6">La s\u00E9lection sneakers la plus pointue de France. Authenticit\u00E9 garantie sur chaque paire.</p></div>
    <div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;color:#555">Boutique</p>${["Catalogue","Nouveaut\u00E9s","Best-sellers","Marques"].map(l => `<p style="font-size:12px;color:#999;margin-bottom:6px">${l}</p>`).join("")}</div>
    <div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;color:#555">Aide</p>${["FAQ","Livraison","Retours","Guide des tailles"].map(l => `<p style="font-size:12px;color:#999;margin-bottom:6px">${l}</p>`).join("")}</div>
    <div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;color:#555">Contact</p>${["contact@sneakvault.fr","01 23 45 67 89","Instagram","TikTok"].map(l => `<p style="font-size:12px;color:#999;margin-bottom:6px">${l}</p>`).join("")}</div>
  </div>
  <div style="display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid #e5e5e5;font-size:10px;color:#bbb">
    <span>\u00A9 2026 SneakVault. Tous droits r\u00E9serv\u00E9s.</span>
    <div style="display:flex;gap:16px"><span>CGV</span><span>Mentions l\u00E9gales</span><span>Confidentialit\u00E9</span><span>Cookies</span></div>
  </div>
</footer>
</body></html>`,
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
      { id: "z2", label: "Galerie + Infos produit", skin: "contenu", height: 64 },
      { id: "z3", label: "Avis clients", skin: "social-proof", height: 28 },
      { id: "z4", label: "Produits similaires", skin: "cards", height: 40 },
      { id: "z5", label: "Footer", skin: "footer", height: 20 },
    ],
    zoningExpanded: true,
  },
  {
    tid: "cart", pid: "home", label: "Panier", type: "detail", priority: "primary",
    desc: "R\u00E9cap commande, modification quantit\u00E9s, code promo",
    rationale: "\u00C9tape cl\u00E9 du tunnel : r\u00E9duire l'abandon de panier",
    cta: ["Commander", "Continuer mes achats"],
    tags: ["conversion", "abandon panier"],
  },
  {
    tid: "checkout", pid: "cart", label: "Tunnel d'achat", type: "form", priority: "primary",
    desc: "3 \u00E9tapes : adresse, livraison, paiement (Stripe)",
    rationale: "Tunnel simplifi\u00E9 pour maximiser la conversion",
    cta: ["Valider et payer"],
    tags: ["conversion", "paiement", "Stripe"],
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
  },
  {
    tid: "article", pid: "blog", label: "Article", type: "detail", priority: "secondary",
    desc: "Article de blog avec images, partage social, articles li\u00E9s",
    rationale: "Contenu SEO long-tail + engagement communaut\u00E9",
    cta: ["Voir les produits cit\u00E9s"],
    tags: ["SEO", "content"],
  },
  {
    tid: "about", pid: "home", label: "\u00C0 propos", type: "detail", priority: "secondary",
    desc: "Histoire de SneakVault, \u00E9quipe, engagements qualit\u00E9 et authenticit\u00E9",
    rationale: "Construire la confiance, storytelling de marque",
    tags: ["branding", "confiance"],
  },
  {
    tid: "contact", pid: "home", label: "Contact", type: "form", priority: "secondary",
    desc: "Formulaire de contact + horaires + plan + lien FAQ",
    rationale: "Dernier recours avant abandon, r\u00E9duire la friction SAV",
    cta: ["Envoyer le message"],
    tags: ["SAV", "confiance"],
  },
  {
    tid: "faq", pid: "contact", label: "FAQ", type: "detail", priority: "utility",
    desc: "Questions fr\u00E9quentes : livraison, retours, tailles, authenticit\u00E9",
    rationale: "D\u00E9charger le SAV, rassurer avant achat",
    tags: ["SEO", "SAV", "confiance"],
  },
  {
    tid: "search", pid: "home", label: "Recherche", type: "search", priority: "secondary",
    desc: "Recherche full-text avec suggestions auto et filtres actifs",
    rationale: "Raccourci direct vers le produit pour les visiteurs d\u00E9cid\u00E9s",
    tags: ["UX", "conversion"],
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

// ─── Wireframe HTML for all pages (shown in Wireframe tab) ──────────────────
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#1a1a1a}`;
const NAV = `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid #e5e5e5"><div style="font-size:20px;font-weight:800">SneakVault</div><div style="display:flex;gap:28px;font-size:13px;color:#555;font-weight:500"><span>Catalogue</span><span>Nouveaut\u00E9s</span><span>Blog</span><span>\u00C0 propos</span></div><div style="display:flex;gap:20px;font-size:13px;color:#555"><span>\u{1F50D}</span><span>\u{1F464}</span><span>\u{1F6D2}</span></div></nav>`;
const FTR = `<footer style="padding:32px 48px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;font-size:10px;color:#bbb"><span>\u00A9 2026 SneakVault</span><div style="display:flex;gap:16px"><span>CGV</span><span>Confidentialit\u00E9</span><span>Contact</span></div></footer>`;
const wrap = (body: string) => `<html><head><style>${CSS}</style></head><body>${NAV}${body}${FTR}</body></html>`;

const wireframes: Record<string, string> = {
  catalog: wrap(`
<div style="padding:12px 48px;font-size:11px;color:#999">Accueil / Catalogue</div>
<div style="padding:0 48px 20px"><h1 style="font-size:28px;font-weight:800">Catalogue</h1><p style="font-size:13px;color:#888;margin-top:4px">128 sneakers disponibles</p></div>
<div style="display:flex;padding:0 48px 48px;gap:28px">
  <aside style="width:220px;flex-shrink:0">
    <p style="font-size:12px;font-weight:700;margin-bottom:16px">Filtres</p>
    ${["Marque","Taille","Prix","Couleur"].map(f => `<div style="margin-bottom:14px"><p style="font-size:11px;font-weight:600;margin-bottom:6px">${f}</p><div style="height:28px;background:#f5f5f5;border-radius:6px"></div></div>`).join("")}
    <button style="width:100%;padding:10px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600">Appliquer</button>
  </aside>
  <div style="flex:1">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <p style="font-size:12px;color:#888">128 r\u00E9sultats</p>
      <select style="padding:7px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:11px"><option>Pertinence</option></select>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
      ${[{n:"Nike Dunk Low",p:"119"},{n:"Adidas Samba",p:"110"},{n:"NB 550",p:"129"},{n:"Puma Suede",p:"89"},{n:"Asics 1130",p:"129"},{n:"Air Max 90",p:"149"}].map(s => `<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:1;margin-bottom:10px"></div><p style="font-size:12px;font-weight:600">${s.n}</p><p style="font-size:13px;font-weight:700;margin-top:4px">${s.p} \u20AC</p></div>`).join("")}
    </div>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:28px">${[1,2,3,"...","12"].map(p => `<span style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;${p===1?"background:#1a1a1a;color:#fff":"background:#f5f5f5"}">${p}</span>`).join("")}</div>
  </div>
</div>`),

  product: wrap(`
<div style="padding:12px 48px;font-size:11px;color:#999">Accueil / Catalogue / Nike Air Max 90</div>
<div style="display:flex;padding:24px 48px 48px;gap:40px">
  <div style="flex:1"><div style="background:#f0f0f0;border-radius:10px;aspect-ratio:1;margin-bottom:10px"></div><div style="display:flex;gap:6px">${[1,2,3,4].map(() => '<div style="width:56px;height:56px;background:#f0f0f0;border-radius:6px"></div>').join("")}</div></div>
  <div style="flex:1;padding-top:8px">
    <p style="font-size:11px;color:#999">Nike</p>
    <h1 style="font-size:26px;font-weight:800;margin:4px 0 12px">Air Max 90</h1>
    <p style="font-size:13px;color:#666;line-height:1.5;margin-bottom:20px">La silhouette iconique des ann\u00E9es 90, revisit\u00E9e avec des mat\u00E9riaux premium.</p>
    <p style="font-size:22px;font-weight:800;margin-bottom:20px">149 \u20AC</p>
    <p style="font-size:11px;font-weight:600;margin-bottom:8px">Taille</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px">${[38,39,40,41,42,43,44,45].map(s => `<span style="width:40px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e5e5;border-radius:6px;font-size:11px">${s}</span>`).join("")}</div>
    <button style="width:100%;padding:13px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:8px">Ajouter au panier</button>
    <button style="width:100%;padding:13px;background:#fff;color:#1a1a1a;border:1px solid #d4d4d4;border-radius:8px;font-size:13px;font-weight:600">\u2661 Wishlist</button>
  </div>
</div>
<section style="padding:36px 48px;border-top:1px solid #e5e5e5"><h2 style="font-size:17px;font-weight:700;margin-bottom:16px">Avis clients</h2><div style="display:flex;gap:12px">${[{n:"Thomas",t:"Parfaite en confort"},{n:"Marie",t:"Taille un peu grand"}].map(r => `<div style="flex:1;padding:16px;background:#fafafa;border-radius:8px"><p style="font-size:11px;font-weight:600;margin-bottom:4px">${r.n}</p><p style="font-size:11px;color:#666">${r.t}</p></div>`).join("")}</div></section>
<section style="padding:36px 48px;border-top:1px solid #e5e5e5"><h2 style="font-size:17px;font-weight:700;margin-bottom:16px">Produits similaires</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${[1,2,3,4].map(() => '<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:1;margin-bottom:6px"></div><p style="font-size:11px;font-weight:600">NB 550</p><p style="font-size:12px;font-weight:700">129 \u20AC</p></div>').join("")}</div></section>`),

  cart: wrap(`
<div style="padding:48px;max-width:800px;margin:0 auto">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:28px">Panier (2 articles)</h1>
  ${[{n:"Nike Air Max 90",p:"149",t:"42"},{n:"Adidas Samba OG",p:"110",t:"41"}].map(i => `<div style="display:flex;align-items:center;gap:20px;padding:20px 0;border-bottom:1px solid #f0f0f0"><div style="width:80px;height:80px;background:#f0f0f0;border-radius:8px;flex-shrink:0"></div><div style="flex:1"><p style="font-size:13px;font-weight:700">${i.n}</p><p style="font-size:11px;color:#999">Taille ${i.t}</p></div><div style="display:flex;align-items:center;gap:12px"><button style="width:28px;height:28px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;font-size:13px">\u2212</button><span style="font-size:13px;font-weight:600">1</span><button style="width:28px;height:28px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;font-size:13px">+</button></div><p style="font-size:14px;font-weight:700;width:60px;text-align:right">${i.p} \u20AC</p></div>`).join("")}
  <div style="display:flex;gap:8px;margin-top:20px"><input style="flex:1;padding:10px 14px;border:1px solid #e5e5e5;border-radius:6px;font-size:12px" placeholder="Code promo" /><button style="padding:10px 16px;background:#f5f5f5;border:1px solid #e5e5e5;border-radius:6px;font-size:12px;font-weight:600">Appliquer</button></div>
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center"><span style="font-size:18px;font-weight:800">Total : 259 \u20AC</span><button style="padding:14px 32px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700">Commander</button></div>
</div>`),

  checkout: wrap(`
<div style="max-width:720px;margin:0 auto;padding:48px">
  <div style="display:flex;gap:24px;margin-bottom:36px">${["1. Adresse","2. Livraison","3. Paiement"].map((s,i) => `<div style="flex:1;text-align:center;padding:10px;border-bottom:3px solid ${i===0?"#1a1a1a":"#e5e5e5"};font-size:12px;font-weight:${i===0?700:500};color:${i===0?"#1a1a1a":"#999"}">${s}</div>`).join("")}</div>
  <h2 style="font-size:18px;font-weight:700;margin-bottom:20px">Adresse de livraison</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    ${["Pr\u00E9nom","Nom","Adresse","Compl\u00E9ment","Code postal","Ville"].map(f => `<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px">${f}</label><input style="width:100%;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:12px"/></div>`).join("")}
  </div>
  <button style="margin-top:28px;width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700">Continuer</button>
</div>`),

  confirm: wrap(`
<div style="text-align:center;padding:80px 48px">
  <div style="font-size:48px;margin-bottom:20px">\u2705</div>
  <h1 style="font-size:28px;font-weight:800;margin-bottom:8px">Merci pour ta commande !</h1>
  <p style="font-size:14px;color:#666;margin-bottom:4px">Commande #SV-20260415-1247</p>
  <p style="font-size:13px;color:#999;margin-bottom:32px">Un email de confirmation a \u00E9t\u00E9 envoy\u00E9.</p>
  <div style="max-width:400px;margin:0 auto;padding:20px;background:#fafafa;border-radius:10px;text-align:left;margin-bottom:32px">
    <p style="font-size:12px;font-weight:700;margin-bottom:12px">R\u00E9capitulatif</p>
    ${[{n:"Nike Air Max 90",p:"149 \u20AC"},{n:"Adidas Samba OG",p:"110 \u20AC"}].map(i => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px"><span>${i.n}</span><span style="font-weight:600">${i.p}</span></div>`).join("")}
    <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:1px solid #e5e5e5;font-size:13px;font-weight:700"><span>Total</span><span>259 \u20AC</span></div>
  </div>
  <div style="display:flex;gap:12px;justify-content:center">
    <button style="padding:12px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600">Suivre ma commande</button>
    <button style="padding:12px 24px;background:#fff;color:#1a1a1a;border:1px solid #d4d4d4;border-radius:8px;font-size:13px;font-weight:600">Retour \u00E0 l'accueil</button>
  </div>
</div>`),

  account: wrap(`
<div style="display:flex;padding:0 48px 48px;gap:32px;margin-top:24px">
  <aside style="width:200px;flex-shrink:0">${["Mon compte","Mes commandes","Wishlist","Adresses","Param\u00E8tres"].map((l,i) => `<div style="padding:10px 14px;border-radius:6px;font-size:12px;font-weight:${i===0?700:500};${i===0?"background:#f5f5f5;":""};margin-bottom:2px">${l}</div>`).join("")}</aside>
  <div style="flex:1">
    <h1 style="font-size:22px;font-weight:800;margin-bottom:24px">Mon compte</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${[{t:"Commandes",v:"3 en cours"},{t:"Wishlist",v:"7 articles"},{t:"Adresses",v:"2 enregistr\u00E9es"},{t:"Cr\u00E9dit fideli\u00E9t\u00E9",v:"45 points"}].map(c => `<div style="padding:20px;background:#fafafa;border-radius:10px"><p style="font-size:11px;color:#999;margin-bottom:4px">${c.t}</p><p style="font-size:16px;font-weight:700">${c.v}</p></div>`).join("")}
    </div>
  </div>
</div>`),

  orders: wrap(`
<div style="max-width:700px;margin:0 auto;padding:48px">
  <h1 style="font-size:22px;font-weight:800;margin-bottom:24px">Mes commandes</h1>
  ${[{id:"SV-2026-1247",d:"15 avril 2026",s:"En livraison",c:"#16a34a",p:"259 \u20AC"},{id:"SV-2026-0983",d:"2 avril 2026",s:"Livr\u00E9e",c:"#999",p:"149 \u20AC"},{id:"SV-2026-0712",d:"18 mars 2026",s:"Livr\u00E9e",c:"#999",p:"89 \u20AC"}].map(o => `<div style="display:flex;justify-content:space-between;align-items:center;padding:18px;border:1px solid #f0f0f0;border-radius:10px;margin-bottom:10px"><div><p style="font-size:13px;font-weight:700">#${o.id}</p><p style="font-size:11px;color:#999;margin-top:2px">${o.d}</p></div><span style="font-size:11px;font-weight:600;color:${o.c}">${o.s}</span><span style="font-size:14px;font-weight:700">${o.p}</span></div>`).join("")}
</div>`),

  wishlist: wrap(`
<div style="padding:48px">
  <h1 style="font-size:22px;font-weight:800;margin-bottom:24px">Wishlist</h1>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
    ${[{n:"NB 2002R",p:"159"},{n:"Nike Dunk Low",p:"119"},{n:"Asics Gel-1130",p:"129"},{n:"Puma Suede XL",p:"89"}].map(s => `<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:1;margin-bottom:10px;position:relative"><button style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:#fff;border:1px solid #e5e5e5;font-size:12px;cursor:pointer">\u2715</button></div><p style="font-size:12px;font-weight:600">${s.n}</p><p style="font-size:13px;font-weight:700;margin-top:4px">${s.p} \u20AC</p><button style="margin-top:8px;width:100%;padding:8px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600">Ajouter au panier</button></div>`).join("")}
  </div>
</div>`),

  blog: wrap(`
<div style="padding:48px">
  <h1 style="font-size:28px;font-weight:800;margin-bottom:8px">Blog</h1>
  <p style="font-size:13px;color:#888;margin-bottom:32px">Actus sneakers, guides, tendances</p>
  <div style="background:#f0f0f0;border-radius:12px;height:280px;margin-bottom:32px;display:flex;align-items:flex-end;padding:28px"><div><span style="background:#1a1a1a;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700">A LA UNE</span><h2 style="font-size:22px;font-weight:700;margin-top:8px;color:#1a1a1a">Les 10 sneakers les plus attendues du printemps 2026</h2></div></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
    ${["Guide des tailles Nike","Samba vs Gazelle : le match","Comment rep\u00E9rer les faux","Tendances automne 2026","Entretenir ses sneakers","Les drops de la semaine"].map(t => `<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:16/10;margin-bottom:10px"></div><p style="font-size:13px;font-weight:600;line-height:1.3">${t}</p><p style="font-size:11px;color:#999;margin-top:4px">5 min de lecture</p></div>`).join("")}
  </div>
</div>`),

  article: wrap(`
<div style="max-width:680px;margin:0 auto;padding:48px">
  <div style="font-size:11px;color:#999;margin-bottom:16px">Blog / Guide</div>
  <h1 style="font-size:32px;font-weight:800;letter-spacing:-0.5px;line-height:1.15;margin-bottom:12px">Les 10 sneakers les plus attendues du printemps 2026</h1>
  <p style="font-size:13px;color:#999;margin-bottom:24px">Par SneakVault \u2022 15 avril 2026 \u2022 5 min</p>
  <div style="background:#f0f0f0;border-radius:10px;aspect-ratio:16/9;margin-bottom:32px"></div>
  <div style="line-height:1.8;font-size:14px;color:#444">
    <p style="margin-bottom:16px">Le printemps 2026 s'annonce riche en sorties. Entre les retours de classiques et les collaborations in\u00E9dites, on a s\u00E9lectionn\u00E9 les 10 paires qui vont marquer la saison.</p>
    <h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:24px 0 12px">1. Nike Air Max 90 "Spring Green"</h2>
    <p style="margin-bottom:16px">Un coloris frais sur la silhouette iconique. La Air Max 90 revient avec des accents verts et une semelle translucide.</p>
    <div style="background:#f0f0f0;border-radius:8px;aspect-ratio:16/9;margin-bottom:24px"></div>
    <h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:24px 0 12px">2. Adidas Samba x Wales Bonner</h2>
    <p style="margin-bottom:16px">La collaboration continue avec un nouveau coloris exclusif. Sortie pr\u00E9vue fin avril, quantit\u00E9s ultra limit\u00E9es.</p>
  </div>
  <section style="margin-top:40px;padding-top:32px;border-top:1px solid #e5e5e5"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Produits cit\u00E9s</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${[1,2,3].map(() => '<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:1;margin-bottom:6px"></div><p style="font-size:11px;font-weight:600">Nike Air Max 90</p><p style="font-size:12px;font-weight:700">149 \u20AC</p></div>').join("")}</div></section>
</div>`),

  about: wrap(`
<section style="padding:80px 48px;text-align:center;background:#fafafa">
  <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:12px">Notre histoire</p>
  <h1 style="font-size:36px;font-weight:800;letter-spacing:-1px;margin-bottom:16px">SneakVault, depuis 2022</h1>
  <p style="font-size:15px;color:#666;max-width:520px;margin:0 auto">N\u00E9s de la passion sneakers, on s\u00E9lectionne les meilleures paires avec un seul crit\u00E8re : l'authenticit\u00E9.</p>
</section>
<section style="padding:56px 48px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center">
    <div style="background:#f0f0f0;border-radius:12px;aspect-ratio:4/3"></div>
    <div><h2 style="font-size:22px;font-weight:700;margin-bottom:12px">Comment tout a commenc\u00E9</h2><p style="font-size:13px;color:#666;line-height:1.7">Fatigu\u00E9s des contrefacons et des revendeurs opaques, on a cr\u00E9\u00E9 SneakVault pour offrir une alternative transparente. Chaque paire est authentifi\u00E9e, chaque prix est juste.</p></div>
  </div>
</section>
<section style="padding:56px 48px;background:#fafafa">
  <h2 style="font-size:22px;font-weight:700;text-align:center;margin-bottom:32px">Nos engagements</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
    ${[{i:"\u2705",t:"Authenticit\u00E9 garantie",d:"Chaque paire v\u00E9rifi\u00E9e par nos experts"},{i:"\u{1F333}",t:"\u00C9co-responsable",d:"Emballages recycl\u00E9s, livraison carbone neutre"},{i:"\u{1F91D}",t:"Prix justes",d:"Pas de sp\u00E9culation, pas de markup abusif"}].map(e => `<div style="text-align:center;padding:28px;background:#fff;border-radius:10px"><p style="font-size:28px;margin-bottom:12px">${e.i}</p><p style="font-size:14px;font-weight:700;margin-bottom:6px">${e.t}</p><p style="font-size:12px;color:#888">${e.d}</p></div>`).join("")}
  </div>
</section>`),

  contact: wrap(`
<div style="max-width:560px;margin:0 auto;padding:48px">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:6px">Contact</h1>
  <p style="font-size:13px;color:#888;margin-bottom:32px">On te r\u00E9pond sous 24h.</p>
  <div style="display:flex;flex-direction:column;gap:14px">
    ${["Nom","Email","Sujet"].map(f => `<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px">${f}</label><input style="width:100%;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:12px"/></div>`).join("")}
    <div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px">Message</label><textarea style="width:100%;padding:10px 12px;border:1px solid #e5e5e5;border-radius:6px;font-size:12px;height:120px;resize:vertical"></textarea></div>
    <button style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;margin-top:8px">Envoyer le message</button>
  </div>
</div>`),

  faq: wrap(`
<div style="max-width:640px;margin:0 auto;padding:48px">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:6px">FAQ</h1>
  <p style="font-size:13px;color:#888;margin-bottom:24px">Les r\u00E9ponses aux questions les plus fr\u00E9quentes.</p>
  <input style="width:100%;padding:12px 16px;border:1px solid #e5e5e5;border-radius:8px;font-size:13px;margin-bottom:28px" placeholder="\u{1F50D} Rechercher une question..." />
  ${["Quels sont les d\u00E9lais de livraison ?","Comment retourner un article ?","Comment savoir si une paire est authentique ?","Quels moyens de paiement acceptez-vous ?","Comment conna\u00EEtre ma taille ?"].map(q => `<div style="padding:16px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;cursor:pointer"><span style="font-size:13px;font-weight:600">${q}</span><span style="color:#ccc;font-size:16px">+</span></div>`).join("")}
  <div style="text-align:center;margin-top:36px;padding:24px;background:#fafafa;border-radius:10px"><p style="font-size:13px;margin-bottom:8px">Tu n'as pas trouv\u00E9 ta r\u00E9ponse ?</p><a style="font-size:13px;font-weight:600;color:#1a1a1a">Nous contacter \u2192</a></div>
</div>`),

  search: wrap(`
<div style="max-width:720px;margin:0 auto;padding:48px">
  <h1 style="font-size:22px;font-weight:800;margin-bottom:20px">Recherche</h1>
  <input style="width:100%;padding:14px 18px;border:1px solid #e5e5e5;border-radius:10px;font-size:14px;margin-bottom:24px" placeholder="\u{1F50D} Nike Air Max, Adidas Samba..." />
  <p style="font-size:12px;color:#999;margin-bottom:16px">24 r\u00E9sultats pour "Nike"</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
    ${[{n:"Air Max 90",p:"149"},{n:"Dunk Low",p:"119"},{n:"Air Force 1",p:"109"},{n:"Air Max 97",p:"179"},{n:"Blazer Mid",p:"99"},{n:"React Vision",p:"139"}].map(s => `<div><div style="background:#f0f0f0;border-radius:8px;aspect-ratio:1;margin-bottom:8px"></div><p style="font-size:12px;font-weight:600">Nike ${s.n}</p><p style="font-size:13px;font-weight:700;margin-top:4px">${s.p} \u20AC</p></div>`).join("")}
  </div>
</div>`),

  legal: wrap(`
<div style="max-width:640px;margin:0 auto;padding:48px">
  <h1 style="font-size:24px;font-weight:800;margin-bottom:24px">Mentions l\u00E9gales</h1>
  ${["Conditions g\u00E9n\u00E9rales de vente","Politique de confidentialit\u00E9","Cookies","Propri\u00E9t\u00E9 intellectuelle"].map(s => `<section style="margin-bottom:28px"><h2 style="font-size:16px;font-weight:700;margin-bottom:8px">${s}</h2><div style="height:60px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0"></div></section>`).join("")}
</div>`),

  "404": wrap(`
<div style="text-align:center;padding:100px 48px">
  <p style="font-size:72px;font-weight:800;color:#f0f0f0;margin-bottom:16px">404</p>
  <h1 style="font-size:24px;font-weight:800;margin-bottom:8px">Page introuvable</h1>
  <p style="font-size:14px;color:#888;margin-bottom:32px">La page que tu cherches n'existe pas ou a \u00E9t\u00E9 d\u00E9plac\u00E9e.</p>
  <div style="display:flex;gap:12px;justify-content:center">
    <button style="padding:12px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600">Retour \u00E0 l'accueil</button>
    <button style="padding:12px 24px;background:#fff;color:#1a1a1a;border:1px solid #d4d4d4;border-radius:8px;font-size:13px;font-weight:600">Rechercher</button>
  </div>
</div>`),
};

// Inject wireframeHtml on all nodes that have a wireframe template
for (const node of nodes) {
  if (wireframes[node.tid]) {
    node.zoningHtml = wireframes[node.tid];
  }
}

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
    if (node.zoningHtml) {
      data.zoningHtml = node.zoningHtml;
      if (node.zoningCanvasMode) {
        data.zoningCanvasMode = node.zoningCanvasMode;
      }
    }

    insertStmt.run(realId, projectId, parentId, posRow.next_pos, JSON.stringify(data), now, now);
  }
})();

console.log(`[ok] Demo project created: ${projectId} (${nodes.length} pages)`);
console.log(`  Slug: ${DEMO_PROJECT_SLUG}`);
console.log(`  Zoning: ${nodes.filter(n => n.zoningBlocks).length} pages with zoning blocks`);
console.log(`  Entry points: ${nodes.filter(n => n.entryPoints).length} pages with entry points`);

db.close();
