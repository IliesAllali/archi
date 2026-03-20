"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Loader2, ArrowRight, FileText, ExternalLink } from "lucide-react"

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
    }
  }, [open])

  useEffect(() => {
    if (mode === "manual" && nameRef.current) {
      nameRef.current.focus()
    }
  }, [mode])

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

  // Create empty project then redirect to settings > AI tab
  const handleAiSetup = async () => {
    setLoading(true)
    setError("")

    try {
      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Nouveau projet" }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/${data.id}/settings?tab=ai`)
        onClose()
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 backdrop-blur-[2px]"
            style={{ backgroundColor: "var(--overlay-bg)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-[520px] bg-bg-elevated border border-line-strong rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ boxShadow: "var(--modal-shadow)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Nouveau projet
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="px-5 pb-5">
              {/* Choice screen */}
              {mode === "choice" && (
                <div className="space-y-2.5 pt-1">
                  {/* AI option */}
                  <button
                    onClick={handleAiSetup}
                    disabled={loading}
                    className="w-full flex items-start gap-3.5 p-4 rounded-lg text-left transition-all duration-150 hover:brightness-105 group disabled:opacity-50"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Demander à mon IA
                      </p>
                      <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Connecte Claude, Cursor ou ChatGPT pour générer l'arborescence
                      </p>
                    </div>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mt-1 shrink-0 animate-spin" style={{ color: "var(--text-faint)" }} />
                    ) : (
                      <ArrowRight className="w-4 h-4 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)" }} />
                    )}
                  </button>

                  {/* Manual option */}
                  <button
                    onClick={() => setMode("manual")}
                    className="w-full flex items-start gap-3.5 p-4 rounded-lg text-left transition-all duration-150 hover:brightness-105 group"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", color: "var(--text-muted)" }}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Projet vide
                      </p>
                      <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Commencer avec une page d'accueil et construire manuellement
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 mt-1 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-faint)" }} />
                  </button>

                  {error && (
                    <p className="text-2xs text-center" style={{ color: "var(--error-text)" }}>{error}</p>
                  )}
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
                      className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none transition-all"
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
                      className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none transition-all"
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
                      className="px-3 h-10 rounded-lg text-xs transition-colors disabled:opacity-50"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleManualCreate}
                      disabled={loading || !name.trim()}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
    </AnimatePresence>
  )
}
