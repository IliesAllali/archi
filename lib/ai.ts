import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AiProvider = "anthropic" | "openai" | "mistral";
export type AiSpeed = "fast" | "quality";

export interface AiNode {
  temp_id: string;
  parent_temp_id: string | null;
  label: string;
  type?: string;
  priority?: "primary" | "secondary" | "utility";
  description?: string;
  rationale?: string;
}

export interface AiEditAction {
  action: "add" | "update" | "delete" | "move";
  node_id?: string; // for update/delete/move
  temp_id?: string; // for add
  parent_temp_id?: string | null; // for add
  parent_id?: string | null; // for move
  label?: string;
  type?: string;
  priority?: "primary" | "secondary" | "utility";
  description?: string;
  rationale?: string;
}

// ─── Provider config ────────────────────────────────────────────────────────

const PROVIDER_MODELS: Record<AiProvider, Record<AiSpeed, string>> = {
  anthropic: { quality: "claude-sonnet-4-20250514", fast: "claude-haiku-4-5-20251001" },
  openai: { quality: "gpt-4o", fast: "gpt-4o-mini" },
  mistral: { quality: "mistral-large-latest", fast: "mistral-small-latest" },
};

function getModel(provider: AiProvider, speed: AiSpeed = "fast"): string {
  return PROVIDER_MODELS[provider][speed];
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  anthropic: "Claude",
  openai: "GPT-4o",
  mistral: "Mistral",
};

export function getProviderLabel(provider: AiProvider): string {
  return PROVIDER_LABELS[provider] || provider;
}

// ─── System prompts ──────────────────────────────────────────────────────────

const GENERATE_SYSTEM = `Tu es un architecte UX/UI expert en arborescences de sites web professionnels.

L'utilisateur va te décrire un site. Tu dois générer une arborescence complète, riche et professionnelle.

Règles :
- Génère entre 10 et 30 pages selon la complexité du site
- La première page est "Accueil" (type: "home", priority: "primary", parent_temp_id: null)
- TOUTES les autres pages DOIVENT avoir un parent_temp_id valide. Crée une vraie hiérarchie :
  - Niveau 1 : sections principales (enfants de "home")
  - Niveau 2 : sous-pages (enfants de leurs sections)
  - Niveau 3 max : pages détail
- Types : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorités : primary (pages clés du parcours), secondary (contenu), utility (légal, 404)
- Inclus toujours : Accueil, Contact, Mentions légales, 404
- CHAQUE page doit avoir : description (2-3 phrases), rationale, cta, tags
- Pense SEO, parcours utilisateur, et conversion

Champs de base (sur TOUTES les pages) :
- "cta": ["Texte bouton 1", "Texte bouton 2"] — appels à l'action
- "tags": ["SEO", "conversion"] — catégorisation

Champs avancés (UNIQUEMENT sur les pages de type "home" et "landing", PAS sur les autres) :
- "entryPoints": sources de trafic EXTERNES au site uniquement. On ne veut PAS de navigation interne (pas de type "nav"). Types valides : google, direct, social, email, ads, qrcode. Exemples : "Recherche Google", "Instagram", "Newsletter", "Google Ads". N'en mets que sur home et landing.
- "zoningBlocks": wireframe layout de la page. UNIQUEMENT sur home et landing. Skins disponibles : nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots. Les heights en % doivent totaliser ~100.
- "zoningExpanded": (boolean) si true, le wireframe est affiché directement dans le canvas. Mets true sur les pages clés (home, landing) pour que l'utilisateur voie immédiatement la structure. Mets false ou omets le champ pour les pages secondaires.

Réponds UNIQUEMENT avec un JSON valide, sans markdown.

Exemple — la homepage AVEC zoningBlocks visibles et entryPoints, une page standard SANS :
{
  "nodes": [
    {
      "temp_id": "home",
      "parent_temp_id": null,
      "label": "Accueil",
      "type": "home",
      "priority": "primary",
      "description": "Page d'entrée principale du site. Présente la proposition de valeur, les features clés et oriente les visiteurs.",
      "rationale": "Point d'entrée principal, doit convertir les visiteurs en utilisateurs",
      "cta": ["Commencer gratuitement", "Voir la démo"],
      "tags": ["SEO", "conversion", "branding"],
      "entryPoints": [{"type": "direct", "label": "URL directe"}, {"type": "google", "label": "Recherche Google"}],
      "zoningBlocks": [
        {"id": "z1", "label": "Navigation", "skin": "nav", "height": 8},
        {"id": "z2", "label": "Hero principal", "skin": "hero", "height": 22},
        {"id": "z3", "label": "Logos clients", "skin": "social-proof", "height": 8},
        {"id": "z4", "label": "Features clés", "skin": "cards", "height": 22},
        {"id": "z5", "label": "Arguments", "skin": "arguments", "height": 15},
        {"id": "z6", "label": "Témoignages", "skin": "social-proof", "height": 10},
        {"id": "z7", "label": "CTA final", "skin": "cta", "height": 8},
        {"id": "z8", "label": "Footer", "skin": "footer", "height": 7}
      ],
      "zoningExpanded": true
    },
    {
      "temp_id": "pricing",
      "parent_temp_id": "home",
      "label": "Tarifs",
      "type": "detail",
      "priority": "primary",
      "description": "Grille tarifaire Free vs Pro avec FAQ billing.",
      "rationale": "Les visiteurs doivent voir les prix pour décider",
      "cta": ["Commencer gratuitement"],
      "tags": ["conversion", "pricing"]
    }
  ]
}

temp_id : snake_case courts. parent_temp_id : null UNIQUEMENT pour "home".`;

const EDIT_SYSTEM = `Tu es un architecte UX/UI expert en arborescences de sites web professionnels.

L'utilisateur te donne l'arborescence actuelle de son site (avec les IDs réels) et te demande une modification.

Tu dois répondre avec une liste d'actions à effectuer sur l'arbre.

CONCEPT CLÉ — Pages vs Sections :
- Une PAGE = un noeud dans l'arborescence (une URL distincte du site). Ex: "Accueil", "Tarifs", "Blog", "Contact".
- Une SECTION = un bloc à l'intérieur d'une page (zoningBlocks). Ex: "Hero", "Features", "Témoignages", "CTA".
- Quand l'utilisateur demande d'ajouter des "sections" à une page existante, utilise "update" avec zoningBlocks. NE CRÉE PAS de nouvelles pages.
- Quand l'utilisateur demande d'ajouter des "pages", utilise "add".

RÈGLE DE SCOPE — Touche uniquement ce qui est demandé :
- Si l'utilisateur demande une modification sur UNE page spécifique, ne modifie QUE cette page. Ne touche pas aux autres.
- Si l'utilisateur demande d'ajouter une section à la page d'accueil, fais un "update" sur la homepage avec les zoningBlocks mis à jour. Ne crée pas de nouvelles pages.
- Ne reformule pas les descriptions ou labels des pages non concernées par la demande.
- Sois minimal et précis : le moins d'actions possible pour satisfaire la demande.

Actions possibles :
- "add" : ajouter une NOUVELLE PAGE au site. TOUJOURS rattacher à un parent existant.
- "update" : modifier une page existante (node_id + champs à modifier). Utilise ceci pour ajouter/modifier des sections (zoningBlocks), changer un label, une description, etc.
- "delete" : supprimer une page (node_id)
- "move" : déplacer une page (node_id + nouveau parent_id)

Règles :
- CHAQUE page ajoutée DOIT avoir un parent_id valide (un ID existant dans l'arbre fourni) ou un parent_temp_id (si son parent est aussi un "add" dans la même réponse).
- Types de pages : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorités : primary (pages clés), secondary (contenu), utility (légal, 404)

Champs disponibles pour "add" et "update" :
- label (string) : nom de la page
- type (string) : type de page
- priority (string) : primary/secondary/utility
- description (string) : description du contenu (2-3 phrases)
- rationale (string) : pourquoi cette page existe
- cta (string[]) : textes des boutons d'action
- tags (string[]) : catégorisation
- entryPoints ({type, label}[]) : sources de trafic EXTERNES uniquement. Types: google, direct, social, email, ads, qrcode. UNIQUEMENT sur home et landing.
- zoningBlocks ({id, label, skin, height}[]) : les SECTIONS INTERNES de la page (wireframe layout). Skins: nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots. Les heights en % doivent totaliser ~100.
- zoningExpanded (boolean) : si true, le wireframe est affiché directement dans le canvas. Utilise true pour rendre le wireframe visible sur les pages clés (home, landing). Utilise false pour cacher le wireframe d'une page. Omets le champ pour ne pas changer la visibilité actuelle.

Exemples de zoningBlocks (sections d'une page) :
- Homepage type : nav(8) → hero(22) → social-proof(8) → cards(22) → arguments(15) → cta(10) → footer(7)
- Landing type : nav(8) → hero(25) → arguments(20) → social-proof(12) → form(20) → footer(7)
- Listing type : nav(8) → breadcrumb(5) → filtres(10) → grille(55) → pagination(8) → footer(8)

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "actions": [
    { "action": "update", "node_id": "REAL_ID", "zoningBlocks": [{"id": "z1", "label": "Nav", "skin": "nav", "height": 8}, ...], "zoningExpanded": true },
    { "action": "add", "temp_id": "faq", "parent_id": "REAL_ID", "label": "FAQ", "type": "detail", "priority": "secondary", "description": "..." },
    { "action": "delete", "node_id": "REAL_ID" },
    { "action": "move", "node_id": "REAL_ID", "parent_id": "NEW_PARENT_ID" }
  ],
  "summary": "Courte explication de ce qui a été fait"
}`;

// ─── Unified LLM call ───────────────────────────────────────────────────────

async function callLLM(
  provider: AiProvider,
  apiKey: string,
  system: string,
  userMessage: string,
  speed: AiSpeed = "fast"
): Promise<string> {
  const model = getModel(provider, speed);

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  // OpenAI and Mistral both use the OpenAI SDK format
  const config: { apiKey: string; baseURL?: string } = { apiKey };
  if (provider === "mistral") {
    config.baseURL = "https://api.mistral.ai/v1";
  }

  const client = new OpenAI(config);
  const response = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content || "";
}

function parseJSON(text: string): unknown {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateSitemap(
  apiKey: string,
  prompt: string,
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast"
): Promise<{ nodes: AiNode[] }> {
  const text = await callLLM(provider, apiKey, GENERATE_SYSTEM, prompt, speed);
  const parsed = parseJSON(text) as { nodes?: AiNode[] };

  if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
    throw new Error("Invalid AI response: missing nodes array");
  }

  return { nodes: parsed.nodes };
}

export async function editSitemap(
  apiKey: string,
  prompt: string,
  currentTree: { id: string; label: string; type: string; parent_id: string | null; children: string[] }[],
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast"
): Promise<{ actions: AiEditAction[]; summary: string }> {
  const treeContext = JSON.stringify(currentTree, null, 2);
  const userMessage = `Voici l'arborescence actuelle :\n\n${treeContext}\n\nDemande : ${prompt}`;

  const text = await callLLM(provider, apiKey, EDIT_SYSTEM, userMessage, speed);
  const parsed = parseJSON(text) as { actions?: AiEditAction[]; summary?: string };

  if (!parsed.actions || !Array.isArray(parsed.actions)) {
    throw new Error("Invalid AI response: missing actions array");
  }

  return { actions: parsed.actions, summary: parsed.summary || "" };
}

// ─── Build context prompt for manual copy-paste mode ─────────────────────────

export function buildCopyPrompt(
  projectName: string,
  currentTree: { id: string; label: string; type: string; parent_id: string | null }[]
): string {
  const treeStr = currentTree
    .map((n) => {
      const depth = getDepth(n.id, currentTree);
      const indent = "  ".repeat(depth);
      return `${indent}- ${n.label} (type: ${n.type}, id: ${n.id})`;
    })
    .join("\n");

  return `Je travaille sur l'arborescence du site "${projectName}" avec l'outil Arbo.

Voici l'arbre actuel :
${treeStr}

Propose des modifications en JSON. Chaque action peut inclure des champs riches optionnels.

Format JSON exact (pas de markdown, pas d'explication) :
{
  "actions": [
    {
      "action": "add",
      "temp_id": "faq",
      "parent_id": "ID_DU_PARENT",
      "label": "FAQ",
      "type": "detail",
      "priority": "secondary",
      "description": "Questions fréquentes",
      "rationale": "Pourquoi cette page existe",
      "cta": ["Texte du bouton"],
      "tags": ["SEO", "conversion"],
      "entryPoints": [{ "type": "google", "label": "Google" }],
      "zoningBlocks": [
        { "id": "z1", "label": "Navigation", "skin": "nav", "height": 18 },
        { "id": "z2", "label": "Contenu", "skin": "contenu", "height": 60 },
        { "id": "z3", "label": "Footer", "skin": "footer", "height": 20 }
      ]
    },
    { "action": "update", "node_id": "ID", "label": "Nouveau nom", "description": "..." },
    { "action": "delete", "node_id": "ID" },
    { "action": "move", "node_id": "ID", "parent_id": "NOUVEL_ID_PARENT" }
  ]
}

Référence rapide :
- Types : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorités : primary, secondary, utility
- Entry points : google, direct, nav, social, email, ads, qrcode
- Zoning skins : nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots

Tous les champs sauf action/label sont optionnels. Utilise-les quand c'est pertinent.

Ma demande : `;

  function getDepth(
    nodeId: string,
    nodes: { id: string; parent_id: string | null }[]
  ): number {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.parent_id) return 0;
    return 1 + getDepth(node.parent_id, nodes);
  }
}
