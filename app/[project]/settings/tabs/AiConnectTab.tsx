"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Plus, Loader2, Trash2, Key } from "lucide-react"

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

export default function AiConnectTab({ projectId }: { projectId: string }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<"claude" | "claude-code" | "cursor" | "chatgpt">("claude")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://arbo.patchou.cloud"

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tokens`)
      .then(r => r.json())
      .then(data => setTokens(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [projectId])

  const headers = (): Record<string, string> => {
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
      headers: headers(),
      body: JSON.stringify({ name: newTokenName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setRevealedToken(data.rawToken)
      setTokens(prev => [{ id: data.id, name: data.name, lastUsedAt: null, createdAt: data.createdAt }, ...prev])
      setNewTokenName("")
      setShowCreate(false)
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

  const tokenValue = revealedToken || "arbo_xxxxxxxxxxxxxxxx"
  const hasToken = revealedToken || tokens.length > 0

  const mcpConfig = JSON.stringify({
    mcpServers: {
      arbo: {
        url: `${baseUrl}/api/mcp`,
        headers: {
          Authorization: `Bearer ${tokenValue}`,
        },
      },
    },
  }, null, 2)

  const chatgptConfig = `URL du serveur MCP :
${baseUrl}/api/mcp

Token d'authentification :
${tokenValue}`

  const claudeCodeCommand = `claude mcp add arbo --transport streamable-http "${baseUrl}/api/mcp" --header "Authorization: Bearer ${tokenValue}"`

  const configTabs = [
    { id: "claude" as const, label: "Claude Desktop" },
    { id: "claude-code" as const, label: "Claude Code" },
    { id: "cursor" as const, label: "Cursor" },
    { id: "chatgpt" as const, label: "ChatGPT" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Connecter une IA
        </h3>
        <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
          Permet à ton agent IA (Claude, Cursor, ChatGPT...) de gérer ce projet
        </p>
      </div>

      {/* Step 1: Token */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            1
          </div>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            Créer un token API
          </p>
        </div>

        {/* Revealed token */}
        {revealedToken && (
          <div
            className="p-3 rounded-lg space-y-2"
            style={{ background: "#16a34a15", border: "1px solid #16a34a40" }}
          >
            <p className="text-2xs font-medium" style={{ color: "#16a34a" }}>
              Token créé ! Copiez-le maintenant, il ne sera plus affiché.
            </p>
            <div className="flex gap-2">
              <code
                className="flex-1 px-3 py-2 rounded-md text-2xs font-mono break-all"
                style={{ background: "var(--canvas-bg)", color: "var(--text-primary)", border: "1px solid var(--line)" }}
              >
                {revealedToken}
              </code>
              <button
                onClick={() => copyText(revealedToken, "token")}
                className="px-3 py-2 rounded-md text-2xs font-medium shrink-0 transition-all"
                style={{
                  background: copied === "token" ? "#16a34a" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {copied === "token" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* Token list */}
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-faint)" }} />
        ) : tokens.length > 0 ? (
          <div className="space-y-1.5">
            {tokens.map(token => (
              <div
                key={token.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                  <span className="text-2xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {token.name}
                  </span>
                  {token.lastUsedAt && (
                    <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                      utilisé {new Date(token.lastUsedAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => revokeToken(token.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-label-faint hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Create token */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-2xs font-medium transition-colors"
            style={{ color: "var(--accent)" }}
          >
            <Plus className="w-3 h-3" />
            {tokens.length > 0 ? "Nouveau token" : "Créer un token"}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTokenName}
              onChange={e => setNewTokenName(e.target.value)}
              placeholder="Nom du token (ex: Mon Claude)"
              autoFocus
              className="flex-1 h-8 px-3 rounded-md text-2xs focus:outline-none"
              style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onKeyDown={e => { if (e.key === "Enter") createToken() }}
            />
            <button
              onClick={createToken}
              disabled={creating || !newTokenName.trim()}
              className="px-3 h-8 rounded-md text-2xs font-medium disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer"}
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Config */}
      {hasToken && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              2
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              Configurer ton IA
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--surface)" }}>
            {configTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-2xs font-medium transition-all"
                style={{
                  background: activeTab === tab.id ? "var(--elevated)" : "transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-faint)",
                  border: activeTab === tab.id ? "1px solid var(--line)" : "1px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config content */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            {activeTab === "chatgpt" ? (
              <>
                <div className="px-3 py-2 text-2xs" style={{ background: "var(--surface)", color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}>
                  Va dans <strong>Settings → Connections → Add MCP Server</strong>
                </div>
                <div className="p-3 space-y-3" style={{ background: "var(--canvas-bg)" }}>
                  <div>
                    <p className="text-2xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>URL du serveur</p>
                    <code className="block px-3 py-2 rounded-md text-2xs font-mono break-all" style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line)" }}>
                      {baseUrl}/api/mcp
                    </code>
                  </div>
                  <div>
                    <p className="text-2xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Header d'authentification</p>
                    <code className="block px-3 py-2 rounded-md text-2xs font-mono break-all" style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line)" }}>
                      Authorization: Bearer {tokenValue}
                    </code>
                  </div>
                </div>
              </>
            ) : activeTab === "claude-code" ? (
              <>
                <div className="px-3 py-2 text-2xs" style={{ background: "var(--surface)", color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}>
                  Lance cette commande dans ton terminal
                </div>
                <pre
                  className="p-3 text-2xs font-mono overflow-x-auto whitespace-pre-wrap"
                  style={{ background: "var(--canvas-bg)", color: "var(--text-secondary)" }}
                >
                  {claudeCodeCommand}
                </pre>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-2xs" style={{ background: "var(--surface)", color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}>
                  {activeTab === "claude" && (
                    <>Ajoute dans <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--elevated)" }}>claude_desktop_config.json</code></>
                  )}
                  {activeTab === "cursor" && (
                    <>Ajoute dans <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--elevated)" }}>.cursor/mcp.json</code> à la racine de ton projet</>
                  )}
                </div>
                <pre
                  className="p-3 text-2xs font-mono overflow-x-auto"
                  style={{ background: "var(--canvas-bg)", color: "var(--text-secondary)" }}
                >
                  {mcpConfig}
                </pre>
              </>
            )}
            <div
              className="px-3 py-2 flex justify-end"
              style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
            >
              <button
                onClick={() => copyText(
                  activeTab === "chatgpt" ? chatgptConfig : activeTab === "claude-code" ? claudeCodeCommand : mcpConfig,
                  "config"
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium transition-all"
                style={{
                  background: copied === "config" ? "#16a34a" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {copied === "config" ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {hasToken && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              3
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              Demande à ton IA
            </p>
          </div>
          <div
            className="p-3 rounded-lg space-y-2"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            <p className="text-2xs italic" style={{ color: "var(--text-muted)" }}>
              Exemples de prompts :
            </p>
            <div className="space-y-1.5">
              {[
                "Génère une arborescence complète pour un site e-commerce de vêtements",
                "Ajoute une page FAQ sous la page Contact",
                "Réorganise les pages pour améliorer le parcours utilisateur",
                "Lis le projet et propose des améliorations",
              ].map((example, i) => (
                <p
                  key={i}
                  className="text-2xs font-mono px-2.5 py-1.5 rounded-md"
                  style={{ background: "var(--elevated)", color: "var(--text-secondary)", border: "1px solid var(--line)" }}
                >
                  "{example}"
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
