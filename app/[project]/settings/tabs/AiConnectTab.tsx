"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, Plus, Loader2, Trash2, Key, Sparkles, ClipboardPaste, Terminal, Upload, AlertTriangle, Zap } from "lucide-react"
import { Events } from "@/lib/posthog"
import {
  AI_PROVIDERS,
  getStoredProvider,
  storeProvider,
  getStoredApiKey,
  storeApiKey as storeProviderApiKey,
  clearApiKey,
  isByokEnabled,
  setByokEnabled,
  getProviderConfig,
} from "@/lib/ai-providers"
import type { AiProvider } from "@/lib/ai-providers"

interface Token {
  id: string
  name: string
  lastUsedAt: number | null
  createdAt: number
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

// Local key helpers removed — now using centralized ai-providers imports

export default function AiConnectTab({ projectId }: { projectId: string }) {
  const [section, setSection] = useState<"builtin" | "byok" | "mcp" | "copypaste">("builtin")

  // MCP state
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<"claude" | "claude-code" | "cursor" | "chatgpt">("claude")

  // BYOK state
  const [byokProvider, setByokProvider] = useState<AiProvider>("anthropic")
  const [byokKey, setByokKey] = useState("")
  const [keySaved, setKeySaved] = useState(false)
  const [byokActive, setByokActive] = useState(true)

  // Credits state
  const [credits, setCredits] = useState<{ creditsTotal: number; creditsUsed: number; creditsRemaining: number } | null>(null)

  // Copy-paste state
  const [copyPromptText, setCopyPromptText] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState("")
  const [importError, setImportError] = useState("")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://arbo.patchou.cloud"

  useEffect(() => {
    fetch("/api/me/mcp-tokens")
      .then(r => r.json())
      .then(data => setTokens(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const p = getStoredProvider()
    setByokProvider(p)
    setByokKey(getStoredApiKey(p))
    setByokActive(isByokEnabled())
    // Fetch credits
    fetch("/api/me/ai-credits")
      .then(r => r.json())
      .then(data => setCredits(data))
      .catch(() => {})
  }, [])

  // Build copy prompt when section changes to copypaste
  useEffect(() => {
    if (section === "copypaste") {
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(project => {
          const nodes = project.nodes || []

          interface CopyNode {
            label: string; type: string; id: string; children: string[]
            priority?: string; description?: string; notes?: string
            rationale?: string; cta?: string[]; tags?: string[]; group?: string
          }

          const treeStr = nodes
            .map((n: CopyNode) => {
              const depth = getNodeDepth(n.id, nodes)
              const indent = "  ".repeat(depth)
              const meta: string[] = [`type: ${n.type}`, `id: ${n.id}`]
              if (n.priority && n.priority !== "secondary") meta.push(`priority: ${n.priority}`)
              if (n.description) meta.push(`desc: "${n.description}"`)
              if (n.tags?.length) meta.push(`tags: [${n.tags.join(", ")}]`)
              if (n.group) meta.push(`group: "${n.group}"`)
              if (n.cta?.length) meta.push(`ctas: [${n.cta.join(", ")}]`)
              if (n.notes) meta.push(`notes: "${n.notes}"`)
              if (n.rationale) meta.push(`rationale: "${n.rationale}"`)
              return `${indent}- ${n.label} (${meta.join(", ")})`
            })
            .join("\n")

          const totalPages = nodes.length
          const types = [...new Set(nodes.map((n: CopyNode) => n.type))].join(", ")

          setCopyPromptText(
`I'm working on the sitemap for "${project.name}" using Arbo (visual sitemap builder).

Project: ${project.name}${project.client ? ` | Client: ${project.client}` : ""}
Pages: ${totalPages} | Types used: ${types}

Current tree:
${treeStr || "(empty)"}

Propose modifications. Reply ONLY with this JSON format (no markdown, no explanation before/after):

{
  "actions": [
    { "action": "add", "temp_id": "short_id", "parent_id": "PARENT_ID", "label": "Page name", "type": "detail", "priority": "secondary", "description": "Short description" },
    { "action": "update", "node_id": "EXISTING_ID", "label": "New name", "description": "New description", "tags": ["tag1"] },
    { "action": "delete", "node_id": "EXISTING_ID" },
    { "action": "move", "node_id": "EXISTING_ID", "parent_id": "NEW_PARENT_ID" }
  ]
}

Page types: home, listing, detail, form, landing, quiz, search, hub, error, legal
Priorities: primary, secondary, utility
Update supports: label, description, type, priority, tags, notes, rationale, cta, group

My request: `
          )
        })
    }
  }, [section, projectId])

  const csrfHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    const csrf = getCsrfToken()
    if (csrf) h["x-csrf-token"] = csrf
    return h
  }

  const createToken = async () => {
    if (!newTokenName.trim()) return
    setCreating(true)
    const res = await fetch("/api/me/mcp-tokens", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify({ name: newTokenName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setRevealedToken(data.token)
      setTokens(prev => [{ id: data.id, name: data.name, lastUsedAt: null, createdAt: data.createdAt }, ...prev])
      setNewTokenName("")
      setShowCreate(false)
      Events.aiTokenCreated(data.scope || "write:nodes")
    }
    setCreating(false)
  }

  const revokeToken = async (tokenId: string) => {
    const csrf = getCsrfToken()
    const h: Record<string, string> = {}
    if (csrf) h["x-csrf-token"] = csrf
    await fetch(`/api/me/mcp-tokens?id=${tokenId}`, { method: "DELETE", headers: h })
    setTokens(prev => prev.filter(t => t.id !== tokenId))
  }

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSaveKey = () => {
    storeProviderApiKey(byokKey, byokProvider)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const handleClearKey = () => {
    clearApiKey(byokProvider)
    setByokKey("")
    setKeySaved(false)
  }

  const handleToggleByok = (enabled: boolean) => {
    setByokEnabled(enabled)
    setByokActive(enabled)
  }

  const handleByokProviderChange = (p: AiProvider) => {
    setByokProvider(p)
    storeProvider(p)
    setByokKey(getStoredApiKey(p))
    setKeySaved(false)
  }

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return
    setImporting(true)
    setImportError("")
    setImportResult("")

    try {
      const parsed = JSON.parse(jsonInput.trim())
      const actions = parsed.actions || parsed

      if (!Array.isArray(actions)) {
        setImportError("Format invalide : attendu un objet avec un tableau \"actions\"")
        return
      }

      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers,
        body: JSON.stringify({ actions, projectId }),
      })

      if (res.ok) {
        const data = await res.json()
        setImportResult(`${data.applied?.length || 0} modification(s) appliquée(s).`)
        setJsonInput("")
      } else {
        const data = await res.json().catch(() => ({}))
        setImportError(data.error || "Erreur d'import")
      }
    } catch {
      setImportError("JSON invalide. Vérifie le format et réessaie.")
    } finally {
      setImporting(false)
    }
  }

  const tokenValue = revealedToken || "<TON_TOKEN>"
  const hasToken = revealedToken || tokens.length > 0
  const hasRealToken = !!revealedToken

  const mcpConfig = JSON.stringify({
    mcpServers: {
      arbo: {
        url: `${baseUrl}/api/mcp`,
        headers: { Authorization: `Bearer ${tokenValue}` },
      },
    },
  }, null, 2)

  const claudeCodeCommand = `claude mcp add --transport http arbo "${baseUrl}/api/mcp" --header "Authorization: Bearer ${tokenValue}"`

  const configTabs = [
    { id: "claude" as const, label: "Claude Desktop" },
    { id: "claude-code" as const, label: "Claude Code" },
    { id: "cursor" as const, label: "Cursor" },
    { id: "chatgpt" as const, label: "ChatGPT" },
  ]

  const byokProviderConfig = getProviderConfig(byokProvider)

  const sections = [
    { id: "builtin" as const, icon: Zap, label: "Crédits IA", desc: "Quota offert" },
    { id: "byok" as const, icon: Key, label: "Clé API perso", desc: "Anthropic, OpenAI, Mistral" },
    { id: "mcp" as const, icon: Terminal, label: "Serveur MCP", desc: "Claude Desktop, Cursor, etc." },
    { id: "copypaste" as const, icon: ClipboardPaste, label: "Copier-coller", desc: "ChatGPT, autre IA" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Intelligence artificielle
        </h3>
        <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
          Configure comment l&apos;IA interagit avec ton projet
        </p>
      </div>

      {/* Section switcher */}
      <div className="flex gap-2">
        {sections.map(s => {
          const Icon = s.icon
          const isActive = section === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg text-center transition-all duration-150"
              style={{
                background: isActive ? "var(--surface)" : "transparent",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? "var(--accent)" : "var(--text-faint)" }} />
              <span className="text-2xs font-medium" style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                {s.label}
              </span>
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>{s.desc}</span>
            </button>
          )
        })}
      </div>

      {/* ─── Section: AI Credits ─────────────────────────────────────────── */}
      {section === "builtin" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Cr&eacute;dits IA
              </h4>
              <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                Chaque compte re&ccedil;oit des cr&eacute;dits gratuits pour tester l&apos;IA. 1 g&eacute;n&eacute;ration rapide = 1 cr&eacute;dit, 1 g&eacute;n&eacute;ration qualit&eacute; = 3 cr&eacute;dits.
              </p>
            </div>

            {credits && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {credits.creditsRemaining}/{credits.creditsTotal} cr&eacute;dits restants
                  </span>
                  <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                    {credits.creditsUsed} utilis&eacute;(s)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${credits.creditsTotal > 0 ? (credits.creditsRemaining / credits.creditsTotal) * 100 : 0}%`,
                      background: credits.creditsRemaining <= 3 ? (credits.creditsRemaining <= 0 ? "#ef4444" : "#eab308") : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              Comment &ccedil;a marche ?
            </h4>
            <ul className="text-2xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
              <li>1. &Agrave; la cr&eacute;ation d&apos;un projet, choisis &laquo; G&eacute;n&eacute;rer avec l&apos;IA &raquo;</li>
              <li>2. Sur le canvas, utilise <kbd className="px-1 py-0.5 rounded text-2xs font-mono" style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}>Ctrl+I</kbd> pour modifier l&apos;arbre</li>
              <li>3. Quand tes cr&eacute;dits sont &eacute;puis&eacute;s, ajoute ta propre cl&eacute; API (onglet &laquo; Cl&eacute; API perso &raquo;)</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg text-2xs" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-strong)", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--accent)" }}>Bient&ocirc;t :</strong> Abonnement Pro pour un quota IA mensuel illimit&eacute;, sans cl&eacute; API.
          </div>
        </div>
      )}

      {/* ─── Section: BYOK (Bring Your Own Key) ───────────────────────────── */}
      {section === "byok" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Cl&eacute; API personnelle
              </h4>
              <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                Utilise ta propre cl&eacute; API pour des g&eacute;n&eacute;rations illimit&eacute;es. Ta cl&eacute; reste dans ton navigateur, jamais stock&eacute;e sur nos serveurs.
              </p>
            </div>

            {/* Provider selector */}
            <div>
              <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                Fournisseur
              </label>
              <div className="flex gap-1.5">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleByokProviderChange(p.id)}
                    className="flex-1 h-9 rounded-lg text-2xs font-medium transition-all duration-150"
                    style={{
                      background: byokProvider === p.id ? "var(--accent)" : "var(--elevated)",
                      color: byokProvider === p.id ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${byokProvider === p.id ? "var(--accent)" : "var(--line-strong)"}`,
                    }}
                  >
                    {p.label.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Key input */}
            <div className="flex gap-2">
              <input
                type="password"
                value={byokKey}
                onChange={(e) => { setByokKey(e.target.value); setKeySaved(false) }}
                placeholder={byokProviderConfig.placeholder}
                className="flex-1 h-9 px-3 rounded-lg text-xs font-mono focus:outline-none"
                style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              />
              <button
                onClick={handleSaveKey}
                disabled={!byokKey.trim()}
                className="px-4 h-9 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  background: keySaved ? "#16a34a" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : "Enregistrer"}
              </button>
              {byokKey && (
                <button
                  onClick={handleClearKey}
                  title="Supprimer la clé"
                  className="px-3 h-9 rounded-lg transition-all"
                  style={{ background: "var(--elevated)", color: "var(--text-muted)", border: "1px solid var(--line-strong)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
              <a
                href={byokProviderConfig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--accent)" }}
              >
                Obtenir une cl&eacute; sur {byokProviderConfig.url.replace("https://", "").split("/")[0]}
              </a>
            </p>
          </div>

          {/* Toggle activer/désactiver BYOK */}
          {byokKey && (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Utiliser cette cl&eacute;</p>
                <p className="text-2xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {byokActive ? "Ta cl\u00e9 est utilis\u00e9e \u00e0 la place des cr\u00e9dits" : "Les cr\u00e9dits IA sont utilis\u00e9s"}
                </p>
              </div>
              <button
                onClick={() => handleToggleByok(!byokActive)}
                className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
                style={{ background: byokActive ? "var(--accent)" : "var(--surface-hover)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
                  style={{ left: byokActive ? "calc(100% - 1.125rem)" : "0.125rem" }}
                />
              </button>
            </div>
          )}

          <div className="p-3 rounded-lg text-2xs" style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--text-muted)" }}>
            Quand une cl&eacute; est configur&eacute;e et active, elle est utilis&eacute;e &agrave; la place des cr&eacute;dits. Tes cr&eacute;dits ne sont pas consomm&eacute;s.
          </div>
        </div>
      )}

      {/* ─── Section: MCP Server ──────────────────────────────────────────── */}
      {section === "mcp" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Serveur MCP
              </h4>
            </div>
            <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
              Les tokens MCP sont li&eacute;s &agrave; ton compte et donnent acc&egrave;s &agrave; tous tes projets.
              Configure-les depuis ton profil.
            </p>
            <a
              href="/account"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all hover:brightness-110"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Configurer dans Mon compte
            </a>
          </div>
        </div>
      )}

      {/* ─── Section: Copy-paste ──────────────────────────────────────────── */}
      {section === "copypaste" && (
        <div className="space-y-5">
          {/* Step 1: Copy prompt */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>1</div>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Copie le prompt</p>
            </div>
            <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
              Colle-le dans ChatGPT, Claude, Gemini ou n&apos;importe quelle IA. Ajoute ta demande à la fin.
            </p>
            <div className="relative">
              <pre className="p-3 rounded-lg text-2xs font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap" style={{ background: "var(--canvas-bg)", color: "var(--text-secondary)", border: "1px solid var(--line)" }}>
                {copyPromptText || "Chargement..."}
              </pre>
              <button
                onClick={() => copyText(copyPromptText, "prompt")}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium transition-all"
                style={{ background: copied === "prompt" ? "#16a34a" : "var(--accent)", color: "#fff" }}
              >
                {copied === "prompt" ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
              </button>
            </div>
          </div>

          {/* Step 2: Paste JSON back */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>2</div>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Colle la réponse JSON</p>
            </div>
            <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
              Copie le JSON généré par l&apos;IA et colle-le ici pour appliquer les modifications.
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => { setJsonInput(e.target.value); setImportError(""); setImportResult("") }}
              placeholder='{ "actions": [ { "action": "add", ... } ] }'
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-2xs font-mono focus:outline-none resize-none"
              style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
            />

            {importError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--error-glow)", border: "1px solid var(--error-border)" }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--error-text)" }} />
                <p className="text-2xs" style={{ color: "var(--error-text)" }}>{importError}</p>
              </div>
            )}

            {importResult && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--success-bg)" }}>
                <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-text)" }} />
                <p className="text-2xs" style={{ color: "var(--success-text)" }}>{importResult}</p>
              </div>
            )}

            <button
              onClick={handleImportJson}
              disabled={importing || !jsonInput.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Appliquer les modifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to compute node depth for tree display
function getNodeDepth(nodeId: string, nodes: { id: string; children: string[] }[]): number {
  for (const n of nodes) {
    if (n.children?.includes(nodeId)) {
      return 1 + getNodeDepth(n.id, nodes)
    }
  }
  return 0
}
