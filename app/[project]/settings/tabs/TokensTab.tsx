"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Copy, Check, Loader2, Key, AlertTriangle } from "lucide-react"
import { csrfHeaders } from "../use-csrf"

interface Token {
  id: string
  name: string
  scope: string
  last_used_at: number | null
  created_at: number
  revoked_at: number | null
}

export default function TokensTab({ projectId }: { projectId: string }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tokenName, setTokenName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens`)
      if (res.ok) setTokens(await res.json())
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  const handleCreate = async () => {
    if (!tokenName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens`, {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify({ name: tokenName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewToken(data.token)
        setTokenName("")
        fetchTokens()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (tokenId: string) => {
    await fetch(`/api/projects/${projectId}/tokens/${tokenId}`, {
      method: "DELETE",
      headers: csrfHeaders(),
    })
    fetchTokens()
  }

  const copyToken = async () => {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Tokens IA
          </h2>
          <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
            Tokens d&apos;accès pour les intégrations IA (GPT Actions, etc.).
          </p>
        </div>
        {!showForm && !newToken && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau token
          </button>
        )}
      </div>

      {/* New token revealed */}
      {newToken && (
        <div
          className="p-4 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--accent)" }}
        >
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                Token créé. Copiez-le maintenant.
              </p>
              <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Ce token ne sera plus visible après avoir fermé cette fenêtre.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <code
              className="flex-1 px-3 py-2 rounded-lg text-2xs font-mono break-all"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--line)",
                color: "var(--text-primary)",
              }}
            >
              {newToken}
            </code>
            <button
              onClick={copyToken}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-all duration-150"
              style={{
                backgroundColor: copied ? "var(--success-bg)" : "var(--accent)",
                color: copied ? "var(--success-text)" : "#fff",
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <button
            onClick={() => { setNewToken(null); setShowForm(false) }}
            className="text-2xs mt-3 font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && !newToken && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div>
            <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
              Nom du token
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="ex: GPT Actions production"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--line)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !tokenName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Générer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-2xs font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Tokens list */}
      {tokens.length === 0 && !showForm && !newToken ? (
        <div className="text-center py-12">
          <Key className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Aucun token IA</p>
          <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
            Les tokens permettent aux agents IA de modifier l&apos;arborescence.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tokens.map((token) => {
            const isRevoked = !!token.revoked_at
            return (
              <div
                key={token.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  opacity: isRevoked ? 0.5 : 1,
                }}
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium block truncate" style={{ color: "var(--text-primary)" }}>
                    {token.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>
                      {token.scope}
                    </span>
                    <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                      Créé le {new Date(token.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {token.last_used_at && (
                      <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                        Utilisé le {new Date(token.last_used_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {isRevoked && (
                      <span className="text-2xs font-medium" style={{ color: "var(--error-text)" }}>
                        Révoqué
                      </span>
                    )}
                  </div>
                </div>

                {!isRevoked && (
                  <button
                    onClick={() => handleRevoke(token.id)}
                    className="px-2.5 py-1 rounded-md text-2xs font-medium transition-colors hover:brightness-110"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      color: "var(--error-text)",
                      border: "1px solid var(--error-border)",
                    }}
                  >
                    Révoquer
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
