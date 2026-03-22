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

const GENERATE_SYSTEM_FAST = `Tu es un architecte UX/UI. Génère une arborescence de site web.

Règles :
- 8 à 15 pages max
- Première page : "Accueil" (type: "home", parent_temp_id: null)
- Hiérarchie : 3 niveaux max. Types : home, listing, detail, form, landing, search, hub, error, legal
- Priority : primary, secondary, utility
- Inclus toujours : Accueil, Contact, Mentions légales, 404
- description : 1 phrase courte. PAS de zoningBlocks, PAS de entryPoints, PAS de rationale.
- Sois ULTRA CONCIS.

Champs : temp_id, parent_temp_id, label, type, priority, description, cta[] (1 bouton), tags[] (1-2 mots)

JSON valide uniquement, sans markdown :
{"nodes":[{"temp_id":"home","parent_temp_id":null,"label":"Accueil","type":"home","priority":"primary","description":"Page d'accueil.","cta":["Découvrir"],"tags":["SEO"]},{"temp_id":"about","parent_temp_id":"home","label":"À propos","type":"detail","priority":"secondary","description":"Présentation.","cta":["Contact"],"tags":["branding"]}]}`;

const GENERATE_SYSTEM_QUALITY = `Tu es un architecte UX/UI expert en arborescences de sites web professionnels.

Génère une arborescence complète et professionnelle.

Règles :
- 10 à 25 pages selon la complexité
- Première page : "Accueil" (type: "home", priority: "primary", parent_temp_id: null)
- Hiérarchie : sections principales → sous-pages → pages détail (3 niveaux max)
- Types : home, listing, detail, form, landing, quiz, search, hub, error, legal
- Priority : primary (parcours clé), secondary (contenu), utility (légal/404)
- Inclus toujours : Accueil, Contact, Mentions légales, 404
- description : 2-3 phrases. rationale : pourquoi la page existe. cta : 1-2 boutons. tags : 2-3 mots.

Champs de base (toutes les pages) : temp_id, parent_temp_id, label, type, priority, description, rationale, cta[], tags[]

Champs avancés (UNIQUEMENT home et landing) :
- entryPoints[{type,label}] — types : google, direct, social, email, ads, qrcode
- zoningBlocks[{id,label,skin,height}] — skins : nav, hero, breadcrumb, titre, contenu, sidebar, cards, grille, filtres, cta, double-cta, form, submit, arguments, social-proof, image, footer. Heights en % totalisant ~100.
- zoningExpanded: true

JSON valide uniquement, sans markdown :
{"nodes":[{"temp_id":"home","parent_temp_id":null,"label":"Accueil","type":"home","priority":"primary","description":"Page d'accueil principale.","rationale":"Point d'entrée principal","cta":["Découvrir"],"tags":["SEO","conversion"],"entryPoints":[{"type":"google","label":"Google"}],"zoningBlocks":[{"id":"z1","label":"Nav","skin":"nav","height":8},{"id":"z2","label":"Hero","skin":"hero","height":25},{"id":"z3","label":"Cards","skin":"cards","height":30},{"id":"z4","label":"CTA","skin":"cta","height":12},{"id":"z5","label":"Footer","skin":"footer","height":8}],"zoningExpanded":true},{"temp_id":"about","parent_temp_id":"home","label":"À propos","type":"detail","priority":"secondary","description":"Présentation de l'entreprise.","rationale":"Crédibilité et confiance","cta":["Contact"],"tags":["branding"]}]}`;

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

Si l'utilisateur pose une QUESTION (avis, analyse, conseil, suggestion) au lieu de demander une modification concrète :
- Réponds avec "type": "chat" et "actions": []
- Mets ta réponse complète dans "summary" (texte riche, détaillé, utile)
- Tu peux analyser l'arborescence, donner ton avis UX, suggérer des améliorations, etc.

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "type": "edit" ou "chat",
  "actions": [
    { "action": "update", "node_id": "REAL_ID", "zoningBlocks": [{"id": "z1", "label": "Nav", "skin": "nav", "height": 8}, ...], "zoningExpanded": true },
    { "action": "add", "temp_id": "faq", "parent_id": "REAL_ID", "label": "FAQ", "type": "detail", "priority": "secondary", "description": "..." },
    { "action": "delete", "node_id": "REAL_ID" },
    { "action": "move", "node_id": "REAL_ID", "parent_id": "NEW_PARENT_ID" }
  ],
  "summary": "Courte explication de ce qui a été fait (ou réponse complète si type chat)"
}`;

// ─── Unified LLM call ───────────────────────────────────────────────────────

async function callLLM(
  provider: AiProvider,
  apiKey: string,
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  speed: AiSpeed = "fast",
  onChunk?: (chunk: string) => void
): Promise<string> {
  const model = getModel(provider, speed);
  const maxTokens = speed === "quality" ? 16384 : 4096;

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });

    if (onChunk) {
      const stream = client.messages.stream({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      });
      let full = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          full += event.delta.text;
          onChunk(event.delta.text);
        }
      }
      return full;
    }

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  // OpenAI and Mistral both use the OpenAI SDK format
  const config: { apiKey: string; baseURL?: string } = { apiKey };
  if (provider === "mistral") {
    config.baseURL = "https://api.mistral.ai/v1";
  }

  const client = new OpenAI(config);

  if (onChunk) {
    const stream = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    });
    let full = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        full += text;
        onChunk(text);
      }
    }
    return full;
  }

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content || "";
}

function parseJSON(text: string): unknown {
  // 1. Try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  let cleaned = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  // 2. Strip leading/trailing non-JSON text (find first { and last })
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // 3. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // 4. Try to repair truncated JSON by closing open structures
    let repaired = cleaned;
    // Count open brackets/braces
    let openBraces = 0, openBrackets = 0;
    let inString = false, escape = false;
    for (const ch of repaired) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }

    // If we're inside a string, close it
    if (inString) repaired += '"';

    // Remove trailing comma before closing
    repaired = repaired.replace(/,\s*$/, "");

    // Close open brackets and braces
    for (let i = 0; i < openBrackets; i++) repaired += "]";
    for (let i = 0; i < openBraces; i++) repaired += "}";

    return JSON.parse(repaired);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateSitemap(
  apiKey: string,
  prompt: string,
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast",
  onChunk?: (chunk: string) => void
): Promise<{ nodes: AiNode[] }> {
  const system = speed === "quality" ? GENERATE_SYSTEM_QUALITY : GENERATE_SYSTEM_FAST;
  const text = await callLLM(provider, apiKey, system, [{ role: "user", content: prompt }], speed, onChunk);
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
  speed: AiSpeed = "fast",
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  onChunk?: (chunk: string) => void
): Promise<{ actions: AiEditAction[]; summary: string; type: "edit" | "chat" }> {
  const treeContext = JSON.stringify(currentTree, null, 2);
  const userMessage = `Voici l'arborescence actuelle :\n\n${treeContext}\n\nDemande : ${prompt}`;

  // Build messages array: prior conversation (summarized) + current request
  // Only keep user messages from history — assistant responses were free-text chat
  // which confuses the model into staying in chat mode. We inject a brief context instead.
  const priorMessages: { role: "user" | "assistant"; content: string }[] = [];
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-8);
    for (const msg of recent) {
      if (msg.role === "user") {
        priorMessages.push(msg);
      } else {
        // Summarize assistant responses to avoid format confusion
        const truncated = msg.content.length > 200 ? msg.content.slice(0, 200) + "..." : msg.content;
        priorMessages.push({ role: "assistant", content: `[R\u00e9ponse pr\u00e9c\u00e9dente : ${truncated}]` });
      }
    }
  }
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...priorMessages,
    { role: "user", content: userMessage },
  ];

  const text = await callLLM(provider, apiKey, EDIT_SYSTEM, messages, speed, onChunk);
  const parsed = parseJSON(text) as { actions?: AiEditAction[]; summary?: string; type?: string };

  if (!parsed.actions || !Array.isArray(parsed.actions)) {
    throw new Error("Invalid AI response: missing actions array");
  }

  const responseType = parsed.type === "chat" ? "chat" : "edit";
  return { actions: parsed.actions, summary: parsed.summary || "", type: responseType };
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
