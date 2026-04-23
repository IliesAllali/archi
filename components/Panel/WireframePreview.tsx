"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Monitor, Tablet, Smartphone, Copy, ClipboardCheck,
  Download, Loader2, Sparkles, Code, Eye, RefreshCw,
} from "lucide-react"
import type { ZoningBlock, NodeData, WireframeAnnotation } from "@/lib/types"
import { isByokEnabled, getStoredApiKey, getStoredProvider } from "@/lib/ai-providers"
import AnnotationsPanel from "./AnnotationsPanel"
import { MessageSquarePlus, PanelRightClose, PanelRightOpen } from "lucide-react"

interface WireframePreviewProps {
  open: boolean
  onClose: () => void
  blocks: ZoningBlock[]
  pageLabel: string
  pageType: string
  projectName: string
  description: string
  /** Current stored HTML (from node.zoningHtml) */
  savedHtml: string | undefined
  /** Current annotations */
  annotations: WireframeAnnotation[]
  /** Save data back to node */
  onSaveHtml: (field: keyof NodeData, value: unknown) => void
  readOnly?: boolean
}

const VIEWPORTS = [
  { width: 1440, label: "Desktop", icon: Monitor },
  { width: 768, label: "Tablet", icon: Tablet },
  { width: 375, label: "Mobile", icon: Smartphone },
] as const

type ViewMode = "preview" | "code"

export default function WireframePreview({
  open,
  onClose,
  blocks,
  pageLabel,
  pageType,
  projectName,
  description,
  savedHtml,
  annotations,
  onSaveHtml,
  readOnly = false,
}: WireframePreviewProps) {
  const [viewport, setViewport] = useState<1440 | 768 | 375>(1440)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [html, setHtml] = useState(savedHtml || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState("")
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Sync from savedHtml when opening
  useEffect(() => {
    if (open && savedHtml) {
      setHtml(savedHtml)
    }
  }, [open, savedHtml])

  // Auto-generate on first open if no saved HTML
  useEffect(() => {
    if (open && !savedHtml && !html && blocks.length > 0 && !isGenerating) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenerationStatus("D\u00e9marrage de la g\u00e9n\u00e9ration...")
    setHtml("")
    setViewMode("preview")

    const provider = getStoredProvider()
    const byokKey = isByokEnabled() ? getStoredApiKey(provider) : ""
    const apiKey = byokKey || "arbo_credits"

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const csrfMatch = typeof document !== "undefined" ? document.cookie.match(/arbo_csrf=([^;]+)/) : null
      const wpHeaders: Record<string, string> = { "Content-Type": "application/json" }
      if (csrfMatch) wpHeaders["x-csrf-token"] = csrfMatch[1]
      const res = await fetch("/api/ai/wireframe", {
        method: "POST",
        headers: wpHeaders,
        body: JSON.stringify({
          apiKey,
          pageLabel,
          pageType,
          projectName,
          description,
          blocks: blocks.map((b) => ({
            label: b.label,
            skin: b.skin,
            height: b.height,
          })),
        }),
        signal: abort.signal,
      })
      // NB: WireframePreview doesn't have projectId in scope; caller-level component
      // owns the projectId and the newer WireframeView flow is the primary path.

      if (!res.ok) {
        const err = await res.json()
        setGenerationStatus(`Erreur : ${err.error || "Erreur inconnue"}`)
        setIsGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setGenerationStatus("Erreur de lecture du stream.")
        setIsGenerating(false)
        return
      }

      const decoder = new TextDecoder()
      let fullHtml = ""
      setGenerationStatus("G\u00e9n\u00e9ration du wireframe...")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "chunk") {
              fullHtml += data.text
              setHtml(fullHtml)
            } else if (data.type === "error") {
              setGenerationStatus(`Erreur IA : ${data.error}`)
            } else if (data.type === "done") {
              setGenerationStatus("")
            }
          } catch {
            // ignore parse errors on partial lines
          }
        }
      }

      // Auto-save to node
      if (fullHtml.trim()) {
        onSaveHtml("zoningHtml", fullHtml.trim())
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setGenerationStatus("Erreur r\u00e9seau.")
      }
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }, [blocks, pageLabel, pageType, projectName, description, onSaveHtml])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [html])

  const handleDownload = useCallback(() => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pageLabel.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-wireframe.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [html, pageLabel])

  const handleSaveEdits = useCallback(() => {
    if (html.trim()) {
      onSaveHtml("zoningHtml", html.trim())
    }
  }, [html, onSaveHtml])

  const handleClose = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, handleClose])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[95vw] h-[90vh] max-w-[1600px] rounded-xl overflow-hidden flex flex-col"
            style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Wireframe
                </h2>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {pageLabel}
                </span>
                {isGenerating && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
                    <span className="text-xs" style={{ color: "var(--accent)" }}>
                      {generationStatus}
                    </span>
                  </div>
                )}
                {!isGenerating && generationStatus && (
                  <span className="text-xs" style={{ color: "var(--error-text)" }}>
                    {generationStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div
                  className="flex items-center rounded-lg p-0.5"
                  style={{ background: "var(--bg-hover)" }}
                >
                  <button
                    onClick={() => setViewMode("preview")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
                    style={{
                      background: viewMode === "preview" ? "var(--elevated)" : "transparent",
                      color: viewMode === "preview" ? "var(--accent)" : "var(--text-faint)",
                      boxShadow: viewMode === "preview" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
                    style={{
                      background: viewMode === "code" ? "var(--elevated)" : "transparent",
                      color: viewMode === "code" ? "var(--accent)" : "var(--text-faint)",
                      boxShadow: viewMode === "code" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Code
                  </button>
                </div>

                {/* Responsive toggle (preview only) */}
                {viewMode === "preview" && (
                  <div
                    className="flex items-center rounded-lg p-0.5"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    {VIEWPORTS.map((vp) => {
                      const Icon = vp.icon
                      const isActive = viewport === vp.width
                      return (
                        <button
                          key={vp.width}
                          onClick={() => setViewport(vp.width as typeof viewport)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
                          style={{
                            background: isActive ? "var(--elevated)" : "transparent",
                            color: isActive ? "var(--accent)" : "var(--text-faint)",
                            boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                          }}
                          title={`${vp.label} (${vp.width}px)`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{vp.width}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Re-generate */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                  title="Reg\u00e9n\u00e9rer le wireframe"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : html ? (
                    <RefreshCw className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {html ? "Reg\u00e9n\u00e9rer" : "G\u00e9n\u00e9rer"}
                </button>

                {/* Copy HTML */}
                {html && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: copied ? "var(--accent)" : "var(--accent-muted)",
                      color: copied ? "#fff" : "var(--accent)",
                    }}
                  >
                    {copied ? (
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copi\u00e9 !" : "Copier HTML"}
                  </button>
                )}

                {/* Download */}
                {html && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      border: "1px solid var(--line)",
                      color: "var(--text-secondary)",
                    }}
                    title="T\u00e9l\u00e9charger"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Annotations toggle */}
                {html && (
                  <button
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      border: "1px solid var(--line)",
                      color: showAnnotations ? "var(--accent)" : "var(--text-faint)",
                      background: showAnnotations ? "var(--accent-muted)" : "transparent",
                    }}
                    title={showAnnotations ? "Masquer les annotations" : "Afficher les annotations"}
                  >
                    {showAnnotations ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">
                      {annotations.length > 0 ? `${annotations.length}` : ""}
                    </span>
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-faint)" }} />
                </button>
              </div>
            </div>

            {/* Content */}
            {viewMode === "preview" ? (
              <div className="flex-1 overflow-hidden flex">
                {/* Wireframe preview area */}
                <div
                  className="flex-1 overflow-auto flex justify-center p-6"
                  style={{ background: "var(--canvas-bg, #f0f0f0)" }}
                >
                  {html ? (
                    <div
                      className="rounded-lg overflow-hidden transition-all duration-300 shadow-lg"
                      style={{
                        width: viewport,
                        maxWidth: "100%",
                        background: "#FFFFFF",
                      }}
                    >
                      <iframe
                        srcDoc={html}
                        sandbox="allow-scripts"
                        className="w-full border-0"
                        style={{ minHeight: "80vh" }}
                        title="Wireframe preview"
                      />
                    </div>
                  ) : !isGenerating ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--accent-muted)" }}
                      >
                        <Sparkles className="w-7 h-7" style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                          G\u00e9n\u00e9rer le wireframe
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          L'IA va cr\u00e9er un wireframe HTML lo-fi \u00e0 partir de vos sections.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        <Sparkles className="w-4 h-4" />
                        G\u00e9n\u00e9rer avec l'IA
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Annotations sidebar */}
                {showAnnotations && html && (
                  <div
                    className="w-[320px] shrink-0 overflow-y-auto p-4"
                    style={{ borderLeft: "1px solid var(--line)", background: "var(--elevated)" }}
                  >
                    <AnnotationsPanel
                      annotations={annotations}
                      onChange={onSaveHtml}
                      readOnly={readOnly}
                      highlightedSection={highlightedSection}
                      onHoverAnnotation={setHighlightedSection}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Code editor view */
              <div className="flex-1 overflow-hidden flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="flex-1 w-full p-5 font-mono text-xs leading-relaxed bg-transparent border-none outline-none resize-none"
                  style={{
                    color: "var(--text-secondary)",
                    caretColor: "var(--accent)",
                    background: "var(--bg-surface)",
                    tabSize: 2,
                  }}
                  spellCheck={false}
                  placeholder="Le HTML g\u00e9n\u00e9r\u00e9 appara\u00eetra ici. Vous pouvez le modifier librement."
                />
                <div
                  className="px-5 py-2 flex items-center justify-between shrink-0"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                    Modifiez le HTML librement. Les changements sont sauvegard\u00e9s automatiquement.
                  </span>
                  <button
                    onClick={handleSaveEdits}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            )}

            {/* Footer hint */}
            <div
              className="px-5 py-2.5 shrink-0 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--line)", background: "var(--bg-surface)" }}
            >
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                Copiez le HTML &rarr; ouvrez <strong>htmlto.design</strong> dans Figma &rarr; onglet Code &rarr; collez.
              </span>
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                {blocks.length} section{blocks.length > 1 ? "s" : ""}{viewport && viewMode === "preview" ? ` \u00b7 ${viewport}px` : ""}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
