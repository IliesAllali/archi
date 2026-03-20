"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, Plus, Loader2, Trash2, Key, Sparkles, ClipboardPaste, Terminal, Upload, AlertTriangle } from "lucide-react"
import { Events } from "@/lib/posthog"

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

function getStoredApiKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("arbo_anthropic_key") || ""
}

function storeApiKey(key: string) {
  if (typeof window === "undefined") return
  if (key.trim()) localStorage.setItem("arbo_anthropic_key", key.trim())
  else localStorage.removeItem("arbo_anthropic_key")
}

export default function AiConnectTab({ projectId }: { projectId: string }) {
  const [section, setSection] = useState<"builtin" | "mcp" | "copypaste">("builtin")

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
  const [anthropicKey, setAnthropicKey] = useState("")
  const [keySaved, setKeySaved] = useState(false)

  // Copy-paste state
  const [copyPromptText, setCopyPromptText] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState("")
  const [importError, setImportError] = useState("")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://arbo.patchou.cloud"

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tokens`)
      .then(r => r.json())
      .then(data => setTokens(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    setAnthropicKey(getStoredApiKey())
  }, [])

  // Build copy prompt when section changes to copypaste
  useEffect(() => {
    if (section === "copypaste") {
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(project => {
          const nodes = project.nodes || []
          const treeStr = nodes
            .map((n: { label: string; type: string; id: string; children: string[] }) => {
              const depth = getNodeDepth(n.id, nodes)
              const indent = "  ".repeat(depth)
              return `${indent}- ${n.label} (type: ${n.type}, id: ${n.id})`
            })
            .join("\n")

          setCopyPromptText(
`Je travaille sur l'arborescence du site "${project.name}" avec l'outil Arbo.

Voici l'arbre actuel :
${treeStr || "(vide)"}

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

Ma demande : `
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
    const res = await fetch(`/api/projects/${projectId}/tokens`, {
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
    await fetch(`/api/projects/${projectId}/tokens/${tokenId}`, { method: "DELETE", headers: h })
    setTokens(prev => prev.filter(t => t.id !== tokenId))
  }

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSaveKey = () => {
    storeApiKey(anthropicKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
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

  const claudeCodeCommand = `claude mcp add arbo --transport streamable-http "${baseUrl}/api/mcp" --header "Authorization: Bearer ${tokenValue}"`

  const configTabs = [
    { id: "claude" as const, label: "Claude Desktop" },
    { id: "claude-code" as const, label: "Claude Code" },
    { id: "cursor" as const, label: "Cursor" },
    { id: "chatgpt" as const, label: "ChatGPT" },
  ]

  const sections = [
    { id: "builtin" as const, icon: Sparkles, label: "IA intégrée", desc: "Clé API Anthropic (BYOK)" },
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

      {/* ─── Section: Built-in AI (BYOK) ─────────────────────────────────── */}
      {section === "builtin" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Clé API Anthropic
              </h4>
              <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                Ta clé est stockée uniquement dans ton navigateur. Elle n&apos;est jamais envoyée à nos serveurs, seulement utilisée pour appeler Claude directement.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => { setAnthropicKey(e.target.value); setKeySaved(false) }}
                placeholder="sk-ant-..."
                className="flex-1 h-9 px-3 rounded-lg text-xs font-mono focus:outline-none"
                style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              />
              <button
                onClick={handleSaveKey}
                disabled={!anthropicKey.trim()}
                className="px-4 h-9 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  background: keySaved ? "#16a34a" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : "Enregistrer"}
              </button>
            </div>
            <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--accent)" }}
              >
                Obtenir une clé sur console.anthropic.com
              </a>
            </p>
          </div>

          <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              Comment ça marche ?
            </h4>
            <ul className="text-2xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
              <li>1. Entre ta clé API Anthropic ci-dessus</li>
              <li>2. À la création d&apos;un projet, choisis &laquo; Générer avec l&apos;IA &raquo;</li>
              <li>3. Sur le canvas, utilise <kbd className="px-1 py-0.5 rounded text-2xs font-mono" style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}>Ctrl+I</kbd> pour modifier l&apos;arbre avec l&apos;IA</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg text-2xs" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--accent)" }}>Bientôt :</strong> Un abonnement mensuel pour utiliser l&apos;IA sans clé API, directement intégrée.
          </div>
        </div>
      )}

      {/* ─── Section: MCP Server ──────────────────────────────────────────── */}
      {section === "mcp" && (
        <div className="space-y-6">
          {/* Step 1: Token */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>1</div>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Créer un token API</p>
            </div>

            {revealedToken && (
              <div className="p-3 rounded-lg space-y-2" style={{ background: "#16a34a15", border: "1px solid #16a34a40" }}>
                <p className="text-2xs font-medium" style={{ color: "#16a34a" }}>
                  Token créé ! Copiez-le maintenant, il ne sera plus affiché.
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 rounded-md text-2xs font-mono break-all" style={{ background: "var(--canvas-bg)", color: "var(--text-primary)", border: "1px solid var(--line)" }}>
                    {revealedToken}
                  </code>
                  <button onClick={() => copyText(revealedToken, "token")} className="px-3 py-2 rounded-md text-2xs font-medium shrink-0 transition-all" style={{ background: copied === "token" ? "#16a34a" : "var(--accent)", color: "#fff" }}>
                    {copied === "token" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-faint)" }} />
            ) : tokens.length > 0 ? (
              <div className="space-y-1.5">
                {tokens.map(token => (
                  <div key={token.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                    <div className="flex items-center gap-2">
                      <Key className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                      <span className="text-2xs font-medium" style={{ color: "var(--text-primary)" }}>{token.name}</span>
                    </div>
                    <button onClick={() => revokeToken(token.id)} className="p-1 rounded hover:bg-red-500/10 text-label-faint hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {!showCreate ? (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-2xs font-medium transition-colors" style={{ color: "var(--accent)" }}>
                <Plus className="w-3 h-3" />
                {tokens.length > 0 ? "Nouveau token" : "Créer un token"}
              </button>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} placeholder="Nom du token (ex: Mon Claude)" autoFocus className="flex-1 h-8 px-3 rounded-md text-2xs focus:outline-none" style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }} onKeyDown={e => { if (e.key === "Enter") createToken() }} />
                <button onClick={createToken} disabled={creating || !newTokenName.trim()} className="px-3 h-8 rounded-md text-2xs font-medium disabled:opacity-40" style={{ background: "var(--accent)", color: "#fff" }}>
                  {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer"}
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Config */}
          {hasToken && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>2</div>
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Configurer ton IA</p>
              </div>

              {!hasRealToken && (
                <div className="p-2.5 rounded-lg text-2xs" style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.30)", color: "rgba(202,138,4,1)" }}>
                  Crée un token ci-dessus pour obtenir une config prête à coller.
                </div>
              )}

              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--surface)" }}>
                {configTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-2xs font-medium transition-all" style={{ background: activeTab === tab.id ? "var(--elevated)" : "transparent", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-faint)", border: activeTab === tab.id ? "1px solid var(--line)" : "1px solid transparent" }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                {activeTab === "chatgpt" ? (
                  <div className="p-3 space-y-3" style={{ background: "var(--canvas-bg)" }}>
                    <p className="text-2xs" style={{ color: "var(--text-muted)" }}>Settings → Connections → Add MCP Server</p>
                    <div><p className="text-2xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>URL</p><code className="block px-3 py-2 rounded-md text-2xs font-mono break-all" style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line)" }}>{baseUrl}/api/mcp</code></div>
                    <div><p className="text-2xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Header</p><code className="block px-3 py-2 rounded-md text-2xs font-mono break-all" style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line)" }}>Authorization: Bearer {tokenValue}</code></div>
                  </div>
                ) : activeTab === "claude-code" ? (
                  <pre className="p-3 text-2xs font-mono overflow-x-auto whitespace-pre-wrap" style={{ background: "var(--canvas-bg)", color: "var(--text-secondary)" }}>{claudeCodeCommand}</pre>
                ) : (
                  <pre className="p-3 text-2xs font-mono overflow-x-auto" style={{ background: "var(--canvas-bg)", color: "var(--text-secondary)" }}>{mcpConfig}</pre>
                )}
                <div className="px-3 py-2 flex justify-end" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
                  <button onClick={() => copyText(activeTab === "chatgpt" ? `${baseUrl}/api/mcp\nAuthorization: Bearer ${tokenValue}` : activeTab === "claude-code" ? claudeCodeCommand : mcpConfig, "config")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium transition-all" style={{ background: copied === "config" ? "#16a34a" : "var(--accent)", color: "#fff" }}>
                    {copied === "config" ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                  </button>
                </div>
              </div>
            </div>
          )}
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
