"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Loader2, ArrowRight, FileText, Terminal, Key, Copy } from "lucide-react"

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewProjectModal({ open, onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"choice" | "ai" | "manual">("choice")
  const [name, setName] = useState("")
  const [client, setClient] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setMode("choice")
      setName("")
      setClient("")
      setError("")
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (mode === "manual" && nameRef.current) {
      nameRef.current.focus()
    }
  }, [mode])

  const createProjectAndRedirect = async (redirectPath: (id: string) => string) => {
    setLoading(true)
    setError("")
    try {
      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim() || "Nouveau projet" }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(redirectPath(data.id))
        onClose()
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login?redirect=/")
      } else {
        setError("Erreur lors de la création")
      }
    } catch {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async () => {
    if (!name.trim()) {
      setError("Nom du projet requis")
      return
    }
    setLoading(true)
    setError("")
    try {
      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/${data.id}`)
        onClose()
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login?redirect=/")
      } else {
        setError("Erreur lors de la création")
      }
    } catch {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: "var(--elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--line-strong)",
  }

  const aiOptions = [
    {
      id: "mcp",
      icon: Terminal,
      label: "Serveur MCP",
      desc: "Claude Desktop, Claude Code, Cursor",
      gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)",
      onClick: () => createProjectAndRedirect((id) => `/${id}/settings?tab=ai`),
    },
    {
      id: "token",
      icon: Key,
      label: "Token API",
      desc: "Accès REST pour scripts et agents custom",
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      onClick: () => createProjectAndRedirect((id) => `/${id}/settings?tab=tokens`),
    },
    {
      id: "prompt",
      icon: Copy,
      label: "Copier-coller",
      desc: "Copie les instructions pour n'importe quelle IA",
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      onClick: () => createProjectAndRedirect((id) => `/${id}/settings?tab=ai`),
    },
  ]

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 backdrop-blur-[2px]"
            style={{ backgroundColor: "var(--overlay-bg)", zIndex: 9998 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-[480px] rounded-xl overflow-hidden"
            style={{ zIndex: 9999, background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {mode === "choice" ? "Nouveau projet" : mode === "ai" ? "Connecter une IA" : "Projet vide"}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5">
              {/* Choice screen */}
              {mode === "choice" && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setMode("ai")}
                    className="w-full flex items-center gap-3 p-3.5 rounded-lg text-left transition-all duration-150 group"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        Générer avec une IA
                      </p>
                      <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                        MCP, token API ou copier-coller
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)" }} />
                  </button>

                  <button
                    onClick={() => setMode("manual")}
                    className="w-full flex items-center gap-3 p-3.5 rounded-lg text-left transition-all duration-150 group"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line-strong)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", color: "var(--text-muted)" }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        Projet vide
                      </p>
                      <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                        Construire manuellement
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)" }} />
                  </button>
                </div>
              )}

              {/* AI sub-choices */}
              {mode === "ai" && (
                <div className="space-y-3 pt-1">
                  <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                    Choisis comment connecter ton IA. Un projet vide sera créé avec les instructions de connexion.
                  </p>

                  <div className="space-y-2">
                    {aiOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          onClick={opt.onClick}
                          disabled={loading}
                          className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 group disabled:opacity-50"
                          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "var(--line-strong)" }}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: opt.gradient, color: "#fff" }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                              {opt.label}
                            </p>
                            <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                              {opt.desc}
                            </p>
                          </div>
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ color: "var(--text-faint)" }} />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)" }} />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {error && (
                    <p className="text-2xs text-center" style={{ color: "var(--error-text)" }}>{error}</p>
                  )}

                  <button
                    onClick={() => setMode("choice")}
                    disabled={loading}
                    className="text-2xs font-medium transition-colors disabled:opacity-50"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ← Retour
                  </button>
                </div>
              )}

              {/* Manual mode */}
              {mode === "manual" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Nom du projet
                    </label>
                    <input
                      ref={nameRef}
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (error) setError("") }}
                      placeholder="Ex : Refonte site ACME"
                      className="w-full h-9 px-3 rounded-lg text-xs focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)"
                        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--line-strong)"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleManualCreate() }}
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Client <span style={{ color: "var(--text-faint)" }}>(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="Ex : ACME Corp"
                      className="w-full h-9 px-3 rounded-lg text-xs focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)"
                        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--line-strong)"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleManualCreate() }}
                    />
                  </div>

                  {error && (
                    <p className="text-2xs" style={{ color: "var(--error-text)" }}>{error}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setMode("choice")}
                      disabled={loading}
                      className="px-3 h-9 rounded-lg text-2xs transition-colors disabled:opacity-50"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleManualCreate}
                      disabled={loading || !name.trim()}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "var(--text-primary)", color: "var(--canvas-bg)" }}
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      Créer le projet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
