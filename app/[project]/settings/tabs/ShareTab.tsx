"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Copy, Check, Trash2, Loader2, Link2, Lock, Eye, MessageSquare } from "lucide-react"
import { csrfHeaders } from "../use-csrf"

interface ShareLink {
  id: string
  token: string
  hasPassword: boolean
  permissions: string
  expiresAt: number | null
  visitCount: number
  createdAt: number
}

export default function ShareTab({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState("")
  const [permissions, setPermissions] = useState("view")
  const [expiresInDays, setExpiresInDays] = useState("")

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/share`)
      if (res.ok) setLinks(await res.json())
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const body: Record<string, string | number> = { permissions }
      if (password.trim()) body.password = password.trim()
      if (expiresInDays && parseInt(expiresInDays) > 0) body.expiresInDays = parseInt(expiresInDays)

      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowForm(false)
        setPassword("")
        setPermissions("view")
        setExpiresInDays("")
        fetchLinks()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (linkId: string) => {
    await fetch(`/api/projects/${projectId}/share/${linkId}`, {
      method: "DELETE",
      headers: csrfHeaders(),
    })
    fetchLinks()
  }

  const copyLink = async (token: string, id: string) => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : `https://arbo.patchou.cloud/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
            Liens de partage
          </h2>
          <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
            Créez des liens pour partager le projet avec des personnes externes.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau lien
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                Mot de passe (optionnel)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide = accès libre"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-colors"
                style={{
                  background: "var(--canvas-bg)",
                  border: "1px solid var(--line)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
              />
            </div>
            <div>
              <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                Expiration (jours)
              </label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="Jamais"
                min="1"
                className="w-24 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
                style={{
                  background: "var(--canvas-bg)",
                  border: "1px solid var(--line)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
              />
            </div>
          </div>
          <div>
            <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
              Permissions
            </label>
            <div className="flex gap-2">
              {[
                { value: "view", label: "Lecture", icon: Eye },
                { value: "comment", label: "Commentaire", icon: MessageSquare },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPermissions(value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all duration-100"
                  style={{
                    background: permissions === value ? "var(--accent-muted)" : "var(--canvas-bg)",
                    color: permissions === value ? "var(--accent)" : "var(--text-muted)",
                    border: `1px solid ${permissions === value ? "var(--accent)" : "var(--line)"}`,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Créer
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

      {/* Links list */}
      {links.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Link2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Aucun lien de partage</p>
          <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
            Créez un lien pour partager ce projet.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {links.map((link) => {
            const isExpired = link.expiresAt && link.expiresAt < Date.now()
            return (
              <div
                key={link.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  opacity: isExpired ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
                  <div className="min-w-0">
                    <span className="text-xs font-mono block truncate" style={{ color: "var(--text-primary)" }}>
                      /share/{link.token}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {link.hasPassword && (
                        <span className="flex items-center gap-0.5 text-2xs" style={{ color: "var(--text-faint)" }}>
                          <Lock className="w-2.5 h-2.5" /> Protégé
                        </span>
                      )}
                      <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                        {link.permissions === "comment" ? "Commentaire" : "Lecture"}
                      </span>
                      <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                        {link.visitCount} visite{link.visitCount !== 1 ? "s" : ""}
                      </span>
                      {link.expiresAt && (
                        <span className="text-2xs" style={{ color: isExpired ? "var(--error-text)" : "var(--text-faint)" }}>
                          {isExpired ? "Expiré" : `Expire le ${new Date(link.expiresAt).toLocaleDateString("fr-FR")}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyLink(link.token, link.id)}
                    className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
                    style={{ color: copiedId === link.id ? "var(--success-text)" : "var(--text-muted)" }}
                    title="Copier le lien"
                  >
                    {copiedId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
                    style={{ color: "var(--text-faint)" }}
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
