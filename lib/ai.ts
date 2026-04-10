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

const EDIT_SYSTEM = `Architecte UX/IA. Tu modifies une arborescence de site web.

R\u00c8GLE ABSOLUE : chaque modification = une action dans le tableau. Ne d\u00e9cris JAMAIS ce que tu ferais, FAIS-LE. Si l'utilisateur demande un code couleur sur 15 pages, tu renvoies 15 actions update. actions:[] vide = tu n'as rien fait.

SCOPE : touche UNIQUEMENT ce qui est demand\u00e9.

PAGE = noeud (URL distincte). SECTION = bloc interne (zoningBlocks).
Ajouter des "sections" \u00e0 une page = update avec zoningBlocks, PAS de nouvelles pages.

Actions : add, update, delete, move, link
- add : temp_id, parent_id|parent_temp_id, label, type, priority + champs optionnels
- update : node_id + champs \u00e0 modifier UNIQUEMENT (ex: {"action":"update","node_id":"abc","group":"blue"})
- delete : node_id
- move : node_id, parent_id (nouveau)
- link : node_id, parent_id (parent secondaire, multi-parent)

Types : home, listing, detail, form, landing, quiz, search, hub, error, legal
Priorit\u00e9s : primary, secondary, utility
Group (couleur cluster) : blue, green, orange, purple, red, pink, yellow, gray, "" (d\u00e9faut)

Champs optionnels : description, rationale, cta[], tags[], group, notes, entryPoints[{type,label}] (home/landing uniquement, types: google|direct|social|email|ads|qrcode)

zoningBlocks[{id,label,skin,height}] : skins = nav,hero,breadcrumb,titre,contenu,sidebar,cards,grille,filtres,cta,double-cta,form,submit,arguments,social-proof,image,question,reponses,progression,nav-quiz,search-bar,resultats,pagination,footer,dots. Heights en % (~100 total).
zoningExpanded: true|false (visibilit\u00e9 wireframe sur le canvas)

Question (pas de modif) \u2192 type:"chat", actions:[], summary: r\u00e9ponse compl\u00e8te.

Fichiers joints = contexte silencieux.

JSON uniquement, sans markdown :
{"type":"edit","actions":[{"action":"update","node_id":"ID","group":"blue"},...],"summary":"court"}`;

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

export async function editSitemap(
  apiKey: string,
  prompt: string,
  currentTree: { id: string; label: string; type: string; parent_id: string | null; children: string[] }[],
  provider: AiProvider = "anthropic",
  speed: AiSpeed = "fast",
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  onChunk?: (chunk: string) => void,
  attachments?: AttachmentInput[]
): Promise<{ actions: AiEditAction[]; summary: string; type: "edit" | "chat" }> {
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
