import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AiProvider = "anthropic" | "openai" | "mistral";

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

const PROVIDER_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  mistral: "mistral-large-latest",
};

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

Champs enrichis (utilise-les sur TOUTES les pages clés, soit au moins 50% des pages) :
- "cta": ["Texte bouton 1", "Texte bouton 2"] — appels à l'action
- "tags": ["SEO", "conversion"] — catégorisation
- "entryPoints": [{"type": "google", "label": "Recherche Google"}] — sources de trafic. Types: google, direct, nav, social, email, ads, qrcode
- "zoningBlocks": wireframe layout de la page. Skins: nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots. Les heights en % doivent totaliser ~100.

Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Exemple de node complet :
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
        {"id": "z2", "label": "Hero", "skin": "hero", "height": 25},
        {"id": "z3", "label": "Features", "skin": "cards", "height": 30},
        {"id": "z4", "label": "Social proof", "skin": "social-proof", "height": 15},
        {"id": "z5", "label": "CTA", "skin": "cta", "height": 12},
        {"id": "z6", "label": "Footer", "skin": "footer", "height": 10}
      ]
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

Actions possibles :
- "add" : ajouter une page. TOUJOURS rattacher à un parent existant via parent_id (ID réel) ou parent_temp_id (si le parent est aussi un ajout). Seule la homepage peut avoir parent_id: null.
- "update" : modifier une page existante (node_id + champs à modifier)
- "delete" : supprimer une page (node_id)
- "move" : déplacer une page (node_id + nouveau parent_id)

Règles CRITIQUES :
- CHAQUE page ajoutée DOIT avoir un parent_id valide (un ID existant dans l'arbre fourni) ou un parent_temp_id (si son parent est aussi un "add" dans la même réponse). Ne jamais créer de pages orphelines.
- Crée des arborescences hiérarchiques réalistes : les sous-pages sont enfants de leur section parente.
- Sois généreux en contenu : description complète, rationale, cta, tags sur chaque page.
- Types disponibles : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorités : primary (pages clés du parcours), secondary (contenu), utility (légal, 404)
- Si l'utilisateur demande d'ajouter un site complet ou une section, crée une vraie hiérarchie (8-25 pages) avec des sous-sections.

Champs disponibles pour "add" et "update" :
- label (string) : nom de la page
- type (string) : type de page
- priority (string) : primary/secondary/utility
- description (string) : description du contenu et du rôle de la page (2-3 phrases)
- rationale (string) : pourquoi cette page existe dans l'arborescence
- cta (string[]) : textes des boutons d'appel à l'action
- tags (string[]) : catégorisation (ex: "SEO", "conversion", "support", "onboarding")
- entryPoints ({type, label}[]) : sources de trafic. Types: google, direct, nav, social, email, ads, qrcode
- zoningBlocks ({id, label, skin, height}[]) : wireframe layout. Skins: nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, question, reponses, progression, nav-quiz, search-bar, resultats, pagination, footer, dots. Les heights en % doivent totaliser ~100.

Utilise entryPoints et zoningBlocks sur les pages clés (homepage, landing, listing au minimum).

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "actions": [
    {
      "action": "add",
      "temp_id": "pricing",
      "parent_id": "REAL_ID_OF_HOME",
      "label": "Tarifs",
      "type": "detail",
      "priority": "primary",
      "description": "Grille tarifaire avec les plans Free et Pro, FAQ billing",
      "rationale": "Essentiel pour la conversion, les visiteurs doivent voir les prix avant de s'inscrire",
      "cta": ["Commencer gratuitement", "Passer Pro"],
      "tags": ["conversion", "pricing"],
      "entryPoints": [{"type": "nav", "label": "Menu principal"}, {"type": "google", "label": "Google 'arbo pricing'"}],
      "zoningBlocks": [
        {"id": "z1", "label": "Navigation", "skin": "nav", "height": 8},
        {"id": "z2", "label": "Hero tarifs", "skin": "hero", "height": 15},
        {"id": "z3", "label": "Grille plans", "skin": "cards", "height": 40},
        {"id": "z4", "label": "FAQ", "skin": "contenu", "height": 25},
        {"id": "z5", "label": "CTA final", "skin": "cta", "height": 7},
        {"id": "z6", "label": "Footer", "skin": "footer", "height": 5}
      ]
    },
    { "action": "update", "node_id": "REAL_ID", "label": "Nouveau nom", "description": "..." },
    { "action": "delete", "node_id": "REAL_ID" },
    { "action": "move", "node_id": "REAL_ID", "parent_id": "NEW_PARENT_REAL_ID" }
  ],
  "summary": "Courte explication de ce qui a été fait"
}`;

// ─── Unified LLM call ───────────────────────────────────────────────────────

async function callLLM(
  provider: AiProvider,
  apiKey: string,
  system: string,
  userMessage: string
): Promise<string> {
  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: PROVIDER_MODELS.anthropic,
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
    model: PROVIDER_MODELS[provider],
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
  provider: AiProvider = "anthropic"
): Promise<{ nodes: AiNode[] }> {
  const text = await callLLM(provider, apiKey, GENERATE_SYSTEM, prompt);
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
  provider: AiProvider = "anthropic"
): Promise<{ actions: AiEditAction[]; summary: string }> {
  const treeContext = JSON.stringify(currentTree, null, 2);
  const userMessage = `Voici l'arborescence actuelle :\n\n${treeContext}\n\nDemande : ${prompt}`;

  const text = await callLLM(provider, apiKey, EDIT_SYSTEM, userMessage);
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
