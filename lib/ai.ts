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

const GENERATE_SYSTEM = `Tu es un architecte UX/UI expert en arborescences de sites web.

L'utilisateur va te décrire un site. Tu dois générer une arborescence complète et professionnelle.

Règles :
- Génère entre 8 et 30 pages selon la complexité du site
- La première page doit toujours être "Accueil" (type: "home", priority: "primary")
- Utilise une hiérarchie logique (max 3 niveaux de profondeur)
- Types disponibles : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priorités : primary (pages clés), secondary (contenu), utility (mentions légales, 404...)
- Inclus toujours : Accueil, Contact, Mentions légales, 404
- Chaque page doit avoir une description courte et un rationale
- Pense SEO, parcours utilisateur, et conversion

Champs optionnels enrichis (utilise-les sur les pages clés) :
- "cta": ["Texte bouton"] — appels à l'action de la page
- "tags": ["SEO", "conversion"] — tags pour catégoriser

Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Format :
{
  "nodes": [
    {
      "temp_id": "home",
      "parent_temp_id": null,
      "label": "Accueil",
      "type": "home",
      "priority": "primary",
      "description": "Page d'entrée principale",
      "rationale": "Oriente les visiteurs",
      "cta": ["Découvrir", "Commencer"],
      "tags": ["SEO", "conversion"]
    }
  ]
}

Les temp_id : snake_case courts. Les parent_temp_id : null = racine (seul "home").`;

const EDIT_SYSTEM = `Tu es un architecte UX/UI expert. L'utilisateur te donne l'arborescence actuelle de son site et te demande une modification.

Tu dois répondre avec une liste d'actions à effectuer sur l'arbre.

Actions possibles :
- "add" : ajouter une page (temp_id + parent_id ou parent_temp_id + label + type + priority + description)
- "update" : modifier une page existante (node_id + champs à modifier)
- "delete" : supprimer une page (node_id)
- "move" : déplacer une page (node_id + nouveau parent_id)

Règles :
- Sois chirurgical : ne modifie que ce qui est demandé
- Si l'utilisateur demande une réorganisation globale, propose les mouvements nécessaires
- Garde la cohérence de l'arbre (pas d'orphelins)
- Pour les ajouts, utilise des temp_id en snake_case
- Les parent_id référencent des IDs réels existants dans l'arbre

Réponds UNIQUEMENT avec un JSON valide :
{
  "actions": [
    { "action": "add", "temp_id": "faq", "parent_id": "REAL_ID_HERE", "label": "FAQ", "type": "detail", "priority": "secondary", "description": "..." },
    { "action": "update", "node_id": "REAL_ID", "label": "Nouveau nom" },
    { "action": "delete", "node_id": "REAL_ID" },
    { "action": "move", "node_id": "REAL_ID", "parent_id": "NEW_PARENT_REAL_ID" }
  ],
  "summary": "Courte explication de ce qui a été fait (1-2 phrases)"
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
