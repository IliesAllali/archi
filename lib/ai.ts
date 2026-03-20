import Anthropic from "@anthropic-ai/sdk";

// ─── Types ───────────────────────────────────────────────────────────────────

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
- Chaque page doit avoir une description courte (1 phrase) et un rationale (pourquoi cette page existe)
- Pense SEO, parcours utilisateur, et conversion

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaire, sans explication.
Format exact :
{
  "nodes": [
    {
      "temp_id": "home",
      "parent_temp_id": null,
      "label": "Accueil",
      "type": "home",
      "priority": "primary",
      "description": "Page d'entrée principale du site",
      "rationale": "Point d'entrée principal, oriente les visiteurs"
    }
  ]
}

Les temp_id doivent être des identifiants courts en snake_case (ex: "home", "about", "blog_list", "contact").
Les parent_temp_id référencent le temp_id du parent. null = page racine (seul "home" devrait être racine).`;

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function generateSitemap(
  apiKey: string,
  prompt: string
): Promise<{ nodes: AiNode[] }> {
  const client = createClient(apiKey);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: GENERATE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON (handle potential markdown wrapping)
  const jsonStr = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
    throw new Error("Invalid AI response: missing nodes array");
  }

  return { nodes: parsed.nodes };
}

export async function editSitemap(
  apiKey: string,
  prompt: string,
  currentTree: { id: string; label: string; type: string; parent_id: string | null; children: string[] }[]
): Promise<{ actions: AiEditAction[]; summary: string }> {
  const client = createClient(apiKey);

  const treeContext = JSON.stringify(currentTree, null, 2);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: EDIT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Voici l'arborescence actuelle :\n\n${treeContext}\n\nDemande : ${prompt}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonStr = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(jsonStr);

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

Je veux que tu me proposes des modifications. Réponds UNIQUEMENT avec ce format JSON (pas de markdown, pas d'explication avant/après) :

{
  "actions": [
    { "action": "add", "temp_id": "identifiant_court", "parent_id": "ID_DU_PARENT", "label": "Nom de la page", "type": "detail", "priority": "secondary", "description": "Description courte" },
    { "action": "update", "node_id": "ID_EXISTANT", "label": "Nouveau nom" },
    { "action": "delete", "node_id": "ID_EXISTANT" },
    { "action": "move", "node_id": "ID_EXISTANT", "parent_id": "NOUVEL_ID_PARENT" }
  ]
}

Types de page : home, listing, detail, form, landing, quiz, search, hub, error, legal
Priorités : primary, secondary, utility

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
