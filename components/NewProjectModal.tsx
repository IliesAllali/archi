"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Loader2, ArrowRight, FileText, Wand2, ChevronDown } from "lucide-react"
import { Events } from "@/lib/posthog"
import {
  AI_PROVIDERS,
  getStoredProvider,
  storeProvider,
  getStoredApiKey,
  storeApiKey,
  getProviderConfig,
} from "@/lib/ai-providers"
import type { AiProvider } from "@/lib/ai-providers"

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

  // AI mode state
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiProjectName, setAiProjectName] = useState("")
  const [provider, setProviderState] = useState<AiProvider>("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [aiStep, setAiStep] = useState<"prompt" | "generating">("prompt")
  const promptRef = useRef<HTMLTextAreaElement>(null)

  const providerConfig = getProviderConfig(provider)

  const handleProviderChange = (p: AiProvider) => {
    setProviderState(p)
    storeProvider(p)
    const key = getStoredApiKey(p)
    setApiKey(key)
    setShowKeyInput(!key)
    setError("")
  }

  useEffect(() => {
    if (open) {
      setMode("choice")
      setName("")
      setClient("")
      setAiPrompt("")
      setAiProjectName("")
      setError("")
      setLoading(false)
      setAiStep("prompt")
      const p = getStoredProvider()
      setProviderState(p)
      const stored = getStoredApiKey(p)
      setApiKey(stored)
      setShowKeyInput(!stored)
    }
  }, [open])

  useEffect(() => {
    if (mode === "manual" && nameRef.current) nameRef.current.focus()
    if (mode === "ai" && promptRef.current) promptRef.current.focus()
  }, [mode])

  // ─── Manual create ────────────────────────────────────────────────────────

  const handleManualCreate = async () => {
    if (!name.trim()) { setError("Nom du projet requis"); return }
    setLoading(true)
    setError("")
    try {
      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim(), client: client.trim() || undefined }),
      })

      if (res.ok) {
        const data = await res.json()
        Events.projectCreated(!!client.trim())
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

  // ─── AI generate ──────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) { setError("Décris ton site"); return }
    if (!apiKey.trim()) { setError("Clé API requise"); setShowKeyInput(true); return }

    storeApiKey(apiKey, provider)
    setLoading(true)
    setError("")
    setAiStep("generating")

    try {
      const csrf = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrf) headers["x-csrf-token"] = csrf

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          apiKey: apiKey.trim(),
          projectName: aiProjectName.trim() || undefined,
          provider,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        Events.projectCreated(false)
        router.push(`/${data.projectId}`)
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Erreur de génération")
        setAiStep("prompt")
      }
    } catch {
      setError("Erreur de connexion")
      setAiStep("prompt")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: "var(--elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--line-strong)",
  }

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
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999, pointerEvents: "none" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:w-[520px] max-w-[520px] rounded-xl overflow-hidden"
              style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)", pointerEvents: "auto" }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {mode === "choice" ? "Nouveau projet" : mode === "ai" ? "Générer avec l\’IA" : "Projet vide"}
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
              {/* ─── Choice screen ─────────────────────────────────────────── */}
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
                        Générer avec l&apos;IA
                      </p>
                      <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                        Décris ton site, l&apos;IA crée l&apos;arborescence
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

              {/* ─── AI mode ───────────────────────────────────────────────── */}
              {mode === "ai" && (
                <div className="space-y-3 pt-1">
                  {aiStep === "generating" ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="relative">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                        <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1" style={{ color: "#8B5CF6" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          Génération en cours...
                        </p>
                        <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {providerConfig.label} analyse ton brief et construit l&apos;arborescence
                        </p>
                      </div>
                      {error && (
                        <p className="text-2xs text-center px-4" style={{ color: "var(--error-text)" }}>{error}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Project name (optional) */}
                      <div>
                        <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                          Nom du projet <span style={{ color: "var(--text-faint)" }}>(optionnel)</span>
                        </label>
                        <input
                          type="text"
                          value={aiProjectName}
                          onChange={(e) => setAiProjectName(e.target.value)}
                          placeholder="Ex : Refonte site ACME"
                          className="w-full h-9 px-3 rounded-lg text-xs focus:outline-none transition-all"
                          style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)" }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
                        />
                      </div>

                      {/* Prompt */}
                      <div>
                        <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                          Décris ton site
                        </label>
                        <textarea
                          ref={promptRef}
                          value={aiPrompt}
                          onChange={(e) => { setAiPrompt(e.target.value); if (error) setError("") }}
                          placeholder="Ex : Site e-commerce de sneakers vintage avec blog, espace membre, programme de fidélité et click & collect"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-all resize-none"
                          style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)" }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
                          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiGenerate() }}
                        />
                        <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
                          Ctrl+Enter pour générer
                        </p>
                      </div>

                      {/* Provider selector + API Key */}
                      <div>
                        <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                          Fournisseur IA
                        </label>
                        <div className="flex gap-1.5">
                          {AI_PROVIDERS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleProviderChange(p.id)}
                              className="flex-1 h-9 rounded-lg text-2xs font-medium transition-all duration-150"
                              style={{
                                background: provider === p.id ? "var(--accent)" : "var(--surface)",
                                color: provider === p.id ? "#fff" : "var(--text-secondary)",
                                border: `1px solid ${provider === p.id ? "var(--accent)" : "var(--line-strong)"}`,
                              }}
                            >
                              {p.label.split(" (")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {showKeyInput ? (
                        <div>
                          <label className="text-2xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                            Clé API {providerConfig.label.split(" (")[0]}
                          </label>
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); if (error) setError("") }}
                            placeholder={providerConfig.placeholder}
                            className="w-full h-9 px-3 rounded-lg text-xs font-mono focus:outline-none transition-all"
                            style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)" }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
                          />
                          <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
                            Stockée localement uniquement.{" "}
                            <a
                              href={providerConfig.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                              style={{ color: "var(--accent)" }}
                            >
                              Obtenir une clé
                            </a>
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowKeyInput(true)}
                          className="text-2xs transition-colors"
                          style={{ color: "var(--text-faint)" }}
                        >
                          Changer la clé API
                        </button>
                      )}

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
                          onClick={handleAiGenerate}
                          disabled={loading || !aiPrompt.trim()}
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          Générer l&apos;arborescence
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─── Manual mode ───────────────────────────────────────────── */}
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
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
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
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
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
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
