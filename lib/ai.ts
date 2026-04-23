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
  action: "add" | "update" | "delete" | "move" | "link";
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

export type ProjectMode = "website" | "app";

export interface UiContext {
  /** "sitemap" or "wireframe" tab */
  activeTab?: "sitemap" | "wireframe";
  /** Currently selected page in the sitemap canvas */
  selectedPageId?: string | null;
  /** Currently viewed page in the wireframe tab */
  wireframePageId?: string | null;
  /** Label of the focused page, for clearer system prompt */
  focusedPageLabel?: string | null;
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

// ─── Multimodal helpers ─────────────────────────────────────────────────────

export interface AttachmentInput {
  name: string
  type: string   // MIME type
  base64: string // raw base64, no data: prefix
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }

/**
 * Build a Claude message content array from text + optional attachments.
 * Returns a plain string if no attachments (backwards-compatible).
 */
export function buildUserContent(
  text: string,
  attachments?: AttachmentInput[]
): string | ContentBlock[] {
  if (!attachments || attachments.length === 0) return text

  const blocks: ContentBlock[] = []

  for (const att of attachments) {
    if (att.type === "application/pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: att.base64 },
      })
    } else if (att.type.startsWith("image/")) {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: att.type as ImageMediaType, data: att.base64 },
      })
    }
  }

  blocks.push({ type: "text", text })
  return blocks
}

// ─── System prompts ──────────────────────────────────────────────────────────

const GENERATE_SYSTEM_FAST = `Architecte UX/IA. G\u00e9n\u00e8re une arborescence de site web.

8-15 pages, 3 niveaux max. Premi\u00e8re page: Accueil (home, parent_temp_id:null). Inclure: Accueil, Contact, Mentions l\u00e9gales, 404.

Types: home, listing, detail, form, landing, search, hub, error, legal
Priority: primary, secondary, utility
Group (couleur cluster): blue, green, orange, purple, red, pink, yellow, gray, ""

Champs: temp_id, parent_temp_id, label, type, priority, group, description (1 phrase), cta[] (1 bouton), tags[] (1-2 mots)
PAS de zoningBlocks, PAS de entryPoints, PAS de rationale.

Fichiers joints = contexte silencieux.

JSON uniquement: {"nodes":[{"temp_id":"home","parent_temp_id":null,"label":"Accueil","type":"home","priority":"primary","group":"blue","description":"Page d'accueil.","cta":["D\u00e9couvrir"],"tags":["SEO"]}]}`;

const GENERATE_SYSTEM_QUALITY = `Architecte UX/IA expert. G\u00e9n\u00e8re une arborescence compl\u00e8te et professionnelle.

10-25 pages, 3 niveaux max. Premi\u00e8re page: Accueil (home, primary, parent_temp_id:null). Inclure: Accueil, Contact, Mentions l\u00e9gales, 404.

Types: home, listing, detail, form, landing, quiz, search, hub, error, legal
Priority: primary (parcours cl\u00e9), secondary (contenu), utility (l\u00e9gal/404)
Group (couleur cluster): blue, green, orange, purple, red, pink, yellow, gray, ""

Champs base: temp_id, parent_temp_id, label, type, priority, group, description (2-3 phrases), rationale, cta[], tags[]

Champs avanc\u00e9s (home+landing UNIQUEMENT):
- entryPoints[{type,label}] types: google,direct,social,email,ads,qrcode
- zoningBlocks[{id,label,skin,height}] skins: nav,hero,breadcrumb,titre,contenu,sidebar,cards,grille,filtres,cta,double-cta,form,submit,arguments,social-proof,image,footer. Heights % ~100 total.
- zoningExpanded:true

Fichiers joints = contexte silencieux.

JSON uniquement: {"nodes":[...]}`;

const EDIT_SYSTEM_WEBSITE = `Architecte UX/IA. Tu modifies une arborescence de SITE WEB (pages avec URLs, SEO, parcours).

RÈGLE ABSOLUE : chaque modification = une action dans le tableau. Ne décris JAMAIS ce que tu ferais, FAIS-LE. Si l'utilisateur demande un code couleur sur 15 pages, tu renvoies 15 actions update. actions:[] vide = tu n'as rien fait.

SCOPE : touche UNIQUEMENT ce qui est demandé.

PAGE = noeud (URL distincte). SECTION = bloc interne (zoningBlocks).
Ajouter des "sections" à une page = update avec zoningBlocks, PAS de nouvelles pages.

Actions : add, update, delete, move, link
- add : temp_id, parent_id|parent_temp_id, label, type, priority + champs optionnels
- update : node_id + champs à modifier UNIQUEMENT (ex: {"action":"update","node_id":"abc","group":"blue"})
- delete : node_id
- move : node_id, parent_id (nouveau)
- link : node_id, parent_id (parent secondaire, multi-parent)

Types : home, listing, detail, form, landing, quiz, search, hub, error, legal
Priorités : primary, secondary, utility
Group (couleur cluster) : blue, green, orange, purple, red, pink, yellow, gray, "" (défaut)

Champs optionnels : description, rationale, cta[], tags[], group, notes, entryPoints[{type,label}] (home/landing uniquement, types: google|direct|social|email|ads|qrcode)

zoningBlocks[{id,label,skin,height}] : skins = nav,hero,breadcrumb,titre,contenu,sidebar,cards,grille,filtres,cta,double-cta,form,submit,arguments,social-proof,image,question,reponses,progression,nav-quiz,search-bar,resultats,pagination,footer,dots. Heights en % (~100 total).
zoningExpanded: true|false (visibilité wireframe sur le canvas)

Question (pas de modif) → type:"chat", actions:[], summary: réponse complète.

Fichiers joints = contexte silencieux.

JSON uniquement, sans markdown :
{"type":"edit","actions":[{"action":"update","node_id":"ID","group":"blue"},...],"summary":"court","memoryUpdate":["fait persistant à retenir"] }`;

const EDIT_SYSTEM_APP = `Architecte UX/Produit. Tu modifies l'architecture d'une APPLICATION (mobile ou web app) : écrans, flows, navigation tab/stack/modal.

RÈGLE ABSOLUE : chaque modification = une action dans le tableau. Ne décris JAMAIS ce que tu ferais, FAIS-LE. actions:[] vide = tu n'as rien fait.

SCOPE : touche UNIQUEMENT ce qui est demandé.

ECRAN = noeud (vue distincte). SECTION = bloc interne (zoningBlocks).
Ajouter des "sections" à un écran = update avec zoningBlocks, PAS de nouveaux écrans.

Patterns d'app à privilégier :
- Racine = home OU onboarding selon le produit
- Tab bar / bottom nav : modules principaux comme enfants directs de home
- Flows : parcours linéaires enfants des modules (ex: création → confirmation)
- Modales / sheets : noeuds secondaires avec priority "utility"
- Pas de page "Mentions légales" ou "Contact" sauf mention explicite ; l'app a settings/profil à la place

Actions : add, update, delete, move, link
- add : temp_id, parent_id|parent_temp_id, label, type, priority + champs optionnels
- update : node_id + champs à modifier UNIQUEMENT
- delete : node_id
- move : node_id, parent_id (nouveau)
- link : node_id, parent_id (parent secondaire, multi-parent)

Types : home, listing, detail, form, landing, quiz, search, hub, error. Ecran d'app → souvent "detail" ou "hub".
Priorités : primary (tab bar / parcours coeur), secondary (écran), utility (modale, settings, onboarding)
Group : blue, green, orange, purple, red, pink, yellow, gray, ""

Champs optionnels : description, rationale, cta[], tags[], group, notes

zoningBlocks pour un écran d'app : pense mobile-first (stack vertical), compose avec nav (top bar), contenu, cards, grille, cta, form, image, footer (tab bar). Heights en % (~100 total).

Question (pas de modif) → type:"chat", actions:[], summary: réponse complète.

Fichiers joints = contexte silencieux.

JSON uniquement, sans markdown :
{"type":"edit","actions":[...],"summary":"court","memoryUpdate":["fait persistant"]}`;

function getEditSystem(mode: ProjectMode, projectContext?: string, uiContext?: UiContext): string {
  const base = mode === "app" ? EDIT_SYSTEM_APP : EDIT_SYSTEM_WEBSITE;
  const parts: string[] = [base];

  if (projectContext && projectContext.trim()) {
    parts.push(`\n\nCONTEXTE PROJET (ne le contredis pas, réfère-toi à ces faits pour personnaliser tes décisions) :\n${projectContext.trim().slice(0, 4000)}`);
  }

  if (uiContext) {
    const where = uiContext.activeTab === "wireframe"
      ? `L'utilisateur est actuellement dans l'éditeur de WIREFRAME${uiContext.focusedPageLabel ? ` sur la page "${uiContext.focusedPageLabel}"` : ""}. Quand il parle de "cette page" ou "ce wireframe", il désigne cet écran. Tu ne peux modifier ici que la structure (ajout/suppression/renommage de pages, sections zoningBlocks). Pour retravailler le HTML du wireframe lui-même, réponds type:"chat" avec summary="→ Utilise l'AI bar depuis l'onglet Wireframe pour modifier la maquette HTML".`
      : uiContext.selectedPageId
        ? `L'utilisateur est sur la SITEMAP, page sélectionnée : ${uiContext.focusedPageLabel ? `"${uiContext.focusedPageLabel}"` : uiContext.selectedPageId}. "Cette page" désigne cette sélection.`
        : `L'utilisateur est sur la SITEMAP globale, aucune page sélectionnée.`;
    parts.push(`\n\nCONTEXTE UI : ${where}`);
  }

  parts.push(`\n\nMEMORY UPDATE : si l'utilisateur te livre une info durable sur le projet (client, contraintes, décisions clés, naming, tonalité), ajoute 1-3 lignes courtes au champ memoryUpdate. Pas de recap évident, pas de doublons avec le CONTEXTE PROJET déjà présent. Sinon, omets le champ.`);

  return parts.join("");
}


// ─── Unified LLM call ───────────────────────────────────────────────────────

async function callLLM(
  provider: AiProvider,
  apiKey: string,
  system: string,
  messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[],
  speed: AiSpeed = "fast",
  onChunk?: (chunk: string) => void
): Promise<string> {
  const model = getModel(provider, speed);
  const maxTokens = speed === "quality" ? 8192 : 2048;

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

  // OpenAI/Mistral don't support our ContentBlock[] — extract text only
  const textMessages = messages.map(m => ({
    role: m.role,
    content: typeof m.content === "string"
      ? m.content
      : m.content.filter(b => b.type === "text").map(b => (b as { type: "text"; text: string }).text).join("\n"),
  }));

  if (onChunk) {
    const stream = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...textMessages,
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
      ...textMessages,
    ],
  });

  return response.choices[0]?.message?.content || "";
}

function parseJSON(text: string): unknown {
  // Strategy: try multiple extraction methods, from most to least precise

  const attempts: string[] = []

  // 1. Try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (codeBlockMatch) attempts.push(codeBlockMatch[1].trim())

  // 2. Extract from first { to last }
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(text.slice(firstBrace, lastBrace + 1))
  }

  // 3. Raw text as-is
  attempts.push(text.trim())

  for (const candidate of attempts) {
    // Direct parse
    try {
      return JSON.parse(candidate)
    } catch { /* try repair */ }

    // Repair truncated JSON
    try {
      let repaired = candidate
      // Strip any trailing text after the main JSON (e.g. "} Voici mes suggestions...")
      const balanced = findBalancedEnd(repaired)
      if (balanced) repaired = balanced

      let openBraces = 0, openBrackets = 0
      let inString = false, escape = false
      for (const ch of repaired) {
        if (escape) { escape = false; continue }
        if (ch === "\\") { escape = true; continue }
        if (ch === '"') { inString = !inString; continue }
        if (inString) continue
        if (ch === "{") openBraces++
        else if (ch === "}") openBraces--
        else if (ch === "[") openBrackets++
        else if (ch === "]") openBrackets--
      }
      if (inString) repaired += '"'
      repaired = repaired.replace(/,\s*$/, "")
      for (let i = 0; i < openBrackets; i++) repaired += "]"
      for (let i = 0; i < openBraces; i++) repaired += "}"

      return JSON.parse(repaired)
    } catch { /* next attempt */ }
  }

  // 4. Last resort: if text contains no JSON but looks like a chat response,
  //    return a chat-type response so the caller doesn't crash
  return { type: "chat", actions: [], summary: text.trim() }
}

/** Find the end of a balanced JSON object starting from index 0 */
function findBalancedEnd(text: string): string | null {
  let depth = 0, inString = false, escape = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === "\\") { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === "{" || ch === "[") depth++
    else if (ch === "}" || ch === "]") {
      depth--
      if (depth === 0) return text.slice(0, i + 1)
    }
  }
  return null // not balanced
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateSitemap(
  apiKey: string,
  prompt: string,
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast",
  onChunk?: (chunk: string) => void,
  attachments?: AttachmentInput[]
): Promise<{ nodes: AiNode[] }> {
  const system = speed === "quality" ? GENERATE_SYSTEM_QUALITY : GENERATE_SYSTEM_FAST;
  const content = buildUserContent(prompt, attachments);
  const text = await callLLM(provider, apiKey, system, [{ role: "user", content }], speed, onChunk);
  const parsed = parseJSON(text) as { nodes?: AiNode[] };

  if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
    throw new Error("Invalid AI response: missing nodes array");
  }

  return { nodes: parsed.nodes };
}

export interface EditSitemapOptions {
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  onChunk?: (chunk: string) => void;
  attachments?: AttachmentInput[];
  mode?: ProjectMode;
  projectContext?: string;
  uiContext?: UiContext;
}

export async function editSitemap(
  apiKey: string,
  prompt: string,
  currentTree: { id: string; label: string; type: string; parent_id: string | null; children: string[] }[],
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast",
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  onChunk?: (chunk: string) => void,
  attachments?: AttachmentInput[],
  options?: { mode?: ProjectMode; projectContext?: string; uiContext?: UiContext }
): Promise<{ actions: AiEditAction[]; summary: string; type: "edit" | "chat"; memoryUpdate?: string[] }> {
  // Compact tree: no pretty-print, skip default values to minimize tokens
  const compactTree = currentTree.map(n => {
    const c: Record<string, unknown> = { id: n.id, label: (n as Record<string, unknown>).label, parent_id: n.parent_id, children: n.children };
    const raw = n as Record<string, unknown>;
    if (raw.type && raw.type !== "detail") c.type = raw.type;
    if (raw.priority && raw.priority !== "secondary") c.priority = raw.priority;
    if (raw.group) c.group = raw.group;
    if (raw.description) c.description = raw.description;
    if (raw.tags && (raw.tags as string[]).length > 0) c.tags = raw.tags;
    if (raw.cta && (raw.cta as string[]).length > 0) c.cta = raw.cta;
    if (raw.notes) c.notes = raw.notes;
    if (raw.zoningBlocks && (raw.zoningBlocks as unknown[]).length > 0) {
      c.zoningBlocks = raw.zoningBlocks;
      if (raw.zoningExpanded) c.zoningExpanded = true;
    }
    if (raw.entryPoints && (raw.entryPoints as unknown[]).length > 0) c.entryPoints = raw.entryPoints;
    return c;
  });
  const treeContext = JSON.stringify(compactTree);
  const userMessage = `Arbre:\n${treeContext}\n\n${prompt}`;

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
  const messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[] = [
    ...priorMessages,
    { role: "user", content: buildUserContent(userMessage, attachments) },
  ];

  const system = getEditSystem(options?.mode ?? "website", options?.projectContext, options?.uiContext);
  const text = await callLLM(provider, apiKey, system, messages, speed, onChunk);
  const parsed = parseJSON(text) as { actions?: AiEditAction[]; summary?: string; type?: string; memoryUpdate?: unknown };

  if (!parsed.actions || !Array.isArray(parsed.actions)) {
    throw new Error("Invalid AI response: missing actions array");
  }

  const responseType = parsed.type === "chat" ? "chat" : "edit";
  const memoryUpdate = Array.isArray(parsed.memoryUpdate)
    ? (parsed.memoryUpdate as unknown[]).map(x => String(x)).filter(Boolean)
    : undefined;
  return { actions: parsed.actions, summary: parsed.summary || "", type: responseType, memoryUpdate };
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
