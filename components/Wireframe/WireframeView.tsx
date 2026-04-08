"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  Monitor, Tablet, Smartphone, Copy, ClipboardCheck,
  Download, Loader2, Sparkles, Code, Eye, RefreshCw,
  PanelRightClose, PanelRightOpen, FileText,
} from "lucide-react"
import type { SiteNode, Project, NodeData, WireframeSettings } from "@/lib/types"
import { DEFAULT_WIREFRAME_SETTINGS } from "@/lib/types"
import { useCanvasStore } from "@/store/canvas-store"
import { isByokEnabled, getStoredApiKey, getStoredProvider } from "@/lib/ai-providers"
import WireframeCommentsPanel from "@/components/Wireframe/WireframeCommentsPanel"
import { makeEditable } from "@/lib/wireframe-editable"
import { composeWireframe, extractHeader, extractFooter, extractStyles } from "@/lib/wireframe-compose"
import type { GlobalSection } from "@/lib/types"

/* ─── Constants ─── */

const VIEWPORTS = [
  { width: 1440, label: "Desktop", icon: Monitor },
  { width: 768, label: "Tablet", icon: Tablet },
  { width: 375, label: "Mobile", icon: Smartphone },
] as const

type ViewMode = "preview" | "code"
type ViewportWidth = 1440 | 768 | 375


/* ─── Page list sidebar ─── */

function PageList({
  nodes,
  selectedId,
  onSelect,
  generatingPageId,
  unseenChanges,
}: {
  nodes: SiteNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  generatingPageId?: string | null
  unseenChanges?: Set<string>
}) {
  const childMap = new Map<string, SiteNode[]>()
  for (const n of nodes) {
    for (const cid of n.children) {
      const child = nodes.find((x) => x.id === cid)
      if (child) {
        if (!childMap.has(n.id)) childMap.set(n.id, [])
        childMap.get(n.id)!.push(child)
      }
    }
  }

  function renderNode(node: SiteNode, depth: number) {
    const isSelected = node.id === selectedId
    const isGenerating = node.id === generatingPageId
    const hasUnseen = unseenChanges?.has(node.id)
    const children = childMap.get(node.id) || []

    return (
      <div key={node.id}>
        <button
          onClick={() => onSelect(node.id)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all rounded-md"
          style={{
            paddingLeft: 12 + depth * 16,
            background: isSelected ? "var(--accent-muted)" : "transparent",
            color: isSelected ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
          <span className="flex-1 text-xs font-medium truncate">{node.label}</span>
          {isGenerating ? (
            <Loader2 className="w-3 h-3 shrink-0 animate-spin" style={{ color: "var(--accent)" }} />
          ) : hasUnseen ? (
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
          ) : null}
        </button>
        {children.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  // Find actual roots
  const rootIds = new Set(nodes.map((n) => n.id))
  for (const n of nodes) {
    for (const cid of n.children) rootIds.delete(cid)
  }
  const actualRoots = nodes.filter((n) => rootIds.has(n.id))

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 shrink-0" style={{ borderBottom: "1px solid var(--line)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Pages</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {actualRoots.map((n) => renderNode(n, 0))}
      </div>
      <div className="px-3 py-2 shrink-0" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-faint)" }}>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Wireframe
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-faint)", opacity: 0.4 }} />
            Blocs
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Empty state ─── */

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--accent-muted)" }}
      >
        <Sparkles className="w-9 h-9" style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          {"G\u00e9n\u00e9rer le wireframe"}
        </p>
        <p className="text-sm max-w-md" style={{ color: "var(--text-faint)" }}>
          {"L\u2019IA va cr\u00e9er un wireframe HTML responsive \u00e0 partir du contexte de cette page."}
        </p>
      </div>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {"G\u00e9n\u00e9rer avec l\u2019IA"}
      </button>
    </div>
  )
}

/* ─── Main view ─── */

interface WireframeViewProps {
  project: Project
  readOnly?: boolean
  currentUser?: { id: string; name: string } | null
  /** Comments panel open state (controlled by parent via header button) */
  commentsOpen?: boolean
  onCommentsOpenChange?: (open: boolean) => void
  /** Called when selected page changes — parent uses this to set AI context */
  onSelectedPageChange?: (pageId: string | null) => void
  /** Streaming HTML from AI bar — updated progressively */
  externalHtml?: string | null
  /** Whether external stream is done */
  externalDone?: boolean
  /** Notify parent when generation starts/stops */
  onGeneratingChange?: (generating: boolean) => void
  /** Called when global sections change — parent syncs its own state for AiBar context */
  onGlobalSectionsChange?: (sections: GlobalSection[]) => void
}

export default function WireframeView({ project, readOnly = false, currentUser, commentsOpen: externalCommentsOpen, onCommentsOpenChange, onSelectedPageChange, externalHtml, externalDone, onGeneratingChange, onGlobalSectionsChange }: WireframeViewProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)

  const [selectedPageId, setSelectedPageIdRaw] = useState<string | null>(() => {
    const home = nodes.find((n) => n.type === "home")
    return home?.id || nodes[0]?.id || null
  })

  const selectedPageIdRef = useRef(selectedPageId)
  const [showMobilePageList, setShowMobilePageList] = useState(false)

  const setSelectedPageId = useCallback((id: string | null) => {
    setSelectedPageIdRaw(id)
    selectedPageIdRef.current = id
    onSelectedPageChange?.(id)
    setShowMobilePageList(false)
  }, [onSelectedPageChange])

  // Notify parent on mount
  useEffect(() => {
    onSelectedPageChange?.(selectedPageId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle streaming HTML from AI bar
  useEffect(() => {
    if (externalHtml && selectedPageId) {
      setHtml(externalHtml)
      setDisplayHtml(externalHtml)
      if (externalDone) {
        handleFieldChange("zoningHtml", externalHtml)
      }
    }
  }, [externalHtml, externalDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const [viewport, setViewport] = useState<ViewportWidth>(1440)
  const [canvasWidth, setCanvasWidth] = useState<number>(1440)
  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [copied, setCopied] = useState(false)
  const [localCommentsOpen, setLocalCommentsOpen] = useState(false)
  const showAnnotations = externalCommentsOpen ?? localCommentsOpen
  const setShowAnnotations = onCommentsOpenChange ?? setLocalCommentsOpen
  const [commentOnSection, setCommentOnSection] = useState<string | null>(null)
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [detectedSections, setDetectedSections] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Sync canvasWidth when viewport preset changes
  useEffect(() => { setCanvasWidth(viewport) }, [viewport])

  // ─── Unseen changes tracking ───
  // Signature = hash of all wireframe HTML lengths + annotations count
  function pageSignature(node: SiteNode): string {
    return `${(node.zoningHtml || "").length}|${(node.annotations || []).length}`
  }

  const seenSignatures = useRef<Map<string, string>>(new Map())

  // Mark current page as "seen" when selected
  useEffect(() => {
    if (!selectedPageId) return
    const node = nodes.find(n => n.id === selectedPageId)
    if (node) {
      seenSignatures.current.set(selectedPageId, pageSignature(node))
    }
  }, [selectedPageId, nodes])

  // Compute set of pages with unseen changes
  const unseenChanges = useMemo(() => {
    const unseen = new Set<string>()
    for (const node of nodes) {
      const lastSeen = seenSignatures.current.get(node.id)
      if (lastSeen !== undefined && lastSeen !== pageSignature(node)) {
        unseen.add(node.id)
      }
    }
    return unseen
  }, [nodes])

  // ─── Draggable canvas resize ───
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = canvasWidth

    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      // Drag is on the right edge, so delta is doubled (centered layout)
      const delta = (ev.clientX - dragStartX.current) * 2
      const newWidth = Math.max(320, Math.min(1600, dragStartWidth.current + delta))
      setCanvasWidth(newWidth)
    }

    const handleUp = () => {
      isDragging.current = false
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
  }, [canvasWidth])

  // displayHtml = what the iframe shows (only updated when NOT streaming)
  // html = live buffer (used in code view)
  const [displayHtml, setDisplayHtml] = useState("")
  const [html, setHtml] = useState("")
  const [isGenerating, setIsGeneratingRaw] = useState(false)
  const setIsGenerating = useCallback((v: boolean) => {
    setIsGeneratingRaw(v)
    onGeneratingChange?.(v)
  }, [onGeneratingChange])
  const [generationStatus, setGenerationStatus] = useState("")
  const [streamProgress, setStreamProgress] = useState(0) // chars received
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedPage = nodes.find((n) => n.id === selectedPageId) || null
  const blocks = selectedPage?.zoningBlocks || []
  const savedHtml = selectedPage?.zoningHtml
  const [globalSections, setGlobalSectionsLocal] = useState<GlobalSection[]>(project.globalSections || [])

  const hasGlobalHeader = globalSections.some(s => s.slot === "header")
  const hasGlobalFooter = globalSections.some(s => s.slot === "footer")

  // Save global sections to project via API + sync store
  const setStoreGlobals = useCanvasStore((s) => s.setGlobalSections)
  const saveGlobalSections = useCallback(async (sections: GlobalSection[]) => {
    setGlobalSectionsLocal(sections)
    setStoreGlobals(sections)
    onGlobalSectionsChange?.(sections)
    const csrf = document.cookie.match(/arbo_csrf=([^;]+)/)?.[1]
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (csrf) headers["x-csrf-token"] = csrf
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ globalSections: sections }),
    })
  }, [project.id, onGlobalSectionsChange, setStoreGlobals])

  // Auto-extract header/footer after first generation (no globals yet)
  const autoExtractGlobals = useCallback((generatedHtml: string, pageId: string) => {
    if (hasGlobalHeader && hasGlobalFooter) return // already have both
    const headerHtml = extractHeader(generatedHtml)
    const footerHtml = extractFooter(generatedHtml)
    if (!headerHtml && !footerHtml) return

    const pageStyles = extractStyles(generatedHtml)
    const sections = [...globalSections]
    let cleanedHtml = generatedHtml

    if (headerHtml && !hasGlobalHeader) {
      sections.push({ id: "global_header", slot: "header", name: "Header", html: `${pageStyles}\n${headerHtml}` })
      cleanedHtml = cleanedHtml.replace(headerHtml, "")
    }
    if (footerHtml && !hasGlobalFooter) {
      sections.push({ id: "global_footer", slot: "footer", name: "Footer", html: `${pageStyles}\n${footerHtml}` })
      cleanedHtml = cleanedHtml.replace(footerHtml, "")
    }

    saveGlobalSections(sections)

    if (cleanedHtml !== generatedHtml) {
      setHtml(cleanedHtml)
      setDisplayHtml(cleanedHtml)
      updateNodeData(pageId, { zoningHtml: cleanedHtml } as Partial<NodeData>)
    }
  }, [hasGlobalHeader, hasGlobalFooter, globalSections, saveGlobalSections, updateNodeData])

  // Compose: wrap page content with global header/footer for display
  const wfSettings: WireframeSettings = project.wireframeSettings
    ? { ...DEFAULT_WIREFRAME_SETTINGS, ...project.wireframeSettings }
    : DEFAULT_WIREFRAME_SETTINGS

  const composedDisplayHtml = displayHtml
    ? composeWireframe(displayHtml, globalSections, wfSettings)
    : ""

  // Listen for messages from the wireframe iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return
      if (e.data.type === "arbo-wireframe-edit" && e.data.html && selectedPageId) {
        const fullHtml = displayHtml.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>${e.data.html}</body>`)
        setHtml(fullHtml)
        setDisplayHtml(fullHtml)
        updateNodeData(selectedPageId, { zoningHtml: fullHtml } as Partial<NodeData>)
      }
      if (e.data.type === "arbo-sections-detected" && Array.isArray(e.data.sections)) {
        setDetectedSections(e.data.sections)
      }
      if (e.data.type === "arbo-section-hover") {
        setHighlightedSection(e.data.section || null)
      }
      if (e.data.type === "arbo-section-click" && e.data.section && showAnnotations) {
        setCommentOnSection(e.data.section)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [selectedPageId, displayHtml, updateNodeData, showAnnotations])

  // Send highlight/scroll commands to the iframe
  const postToIframe = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*")
  }, [])

  const handleHoverAnnotation = useCallback((section: string | null) => {
    setHighlightedSection(section)
    postToIframe({ type: "arbo-highlight-section", section })
  }, [postToIframe])

  const handleScrollToSection = useCallback((section: string) => {
    postToIframe({ type: "arbo-scroll-to-section", section })
  }, [postToIframe])

  // Reset detected sections when page changes
  // Sync from saved when page or viewport changes
  useEffect(() => {
    const h = savedHtml || ""
    setHtml(h)
    setDisplayHtml(h)
    setViewMode("preview")
    setGenerationStatus("")
    setDetectedSections([])
  }, [selectedPageId, savedHtml])

  const handleFieldChange = useCallback(
    (field: keyof NodeData, value: unknown) => {
      if (!selectedPageId) return
      updateNodeData(selectedPageId, { [field]: value } as Partial<NodeData>)
    },
    [selectedPageId, updateNodeData]
  )

  // Track which page is generating (independent of selection)
  const [generatingPageId, setGeneratingPageId] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!selectedPage) return

    const targetPageId = selectedPage.id
    const targetLabel = selectedPage.label
    const targetType = selectedPage.type
    const targetDesc = selectedPage.description || ""
    const targetBlocks = blocks

    setGeneratingPageId(targetPageId)
    setIsGenerating(true)
    setGenerationStatus(`${targetLabel}...`)
    setHtml("")
    setDisplayHtml("")
    setStreamProgress(0)
    setViewMode("preview")

    const provider = getStoredProvider()
    const byokKey = isByokEnabled() ? getStoredApiKey(provider) : ""
    const apiKey = byokKey || "arbo_credits"

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch("/api/ai/wireframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          pageLabel: targetLabel,
          pageType: targetType,
          projectName: project.name,
          projectClient: project.client || "",
          description: targetDesc,
          siteContext: nodes
            .filter(n => n.id !== targetPageId)
            .slice(0, 12)
            .map(n => `${n.label} (${n.type})${n.description ? `: ${n.description.slice(0, 100)}` : ""}`)
            .join("\n"),
          blocks: targetBlocks.length > 0
            ? targetBlocks.map((b) => ({ label: b.label, skin: b.skin, height: b.height }))
            : [],
          hasGlobalHeader,
          hasGlobalFooter,
          fidelity: wfSettings.fidelity,
          font: wfSettings.font,
        }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        setGenerationStatus(`Erreur : ${err.error || "Erreur inconnue"}`)
        setIsGenerating(false)
        setGeneratingPageId(null)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { setIsGenerating(false); setGeneratingPageId(null); return }

      const decoder = new TextDecoder()
      let fullHtml = ""
      let lastDisplayUpdate = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "chunk") {
              fullHtml += data.text
              setStreamProgress(fullHtml.length)
              const now = Date.now()
              if (now - lastDisplayUpdate > 2000 && selectedPageIdRef.current === targetPageId) {
                lastDisplayUpdate = now
                setHtml(fullHtml)
                setDisplayHtml(fullHtml)
              }
            } else if (data.type === "error") {
              setGenerationStatus(`Erreur : ${data.error}`)
            } else if (data.type === "done") {
              setGenerationStatus("")
            }
          } catch { /* partial line */ }
        }
      }

      if (fullHtml.trim()) {
        updateNodeData(targetPageId, { zoningHtml: fullHtml.trim() } as Partial<NodeData>)
        // Auto-extract header/footer from the first generated page
        autoExtractGlobals(fullHtml.trim(), targetPageId)
      }
      if (selectedPageIdRef.current === targetPageId) {
        setHtml(fullHtml)
        setDisplayHtml(fullHtml)
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setGenerationStatus("Erreur r\u00e9seau.")
      }
    } finally {
      setIsGenerating(false)
      setGeneratingPageId(null)
      abortRef.current = null
    }
  }, [selectedPage, blocks, project, nodes, updateNodeData, hasGlobalHeader, hasGlobalFooter, globalSections, autoExtractGlobals])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(composedDisplayHtml || html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [composedDisplayHtml, html])

  const handleDownload = useCallback(() => {
    const exportHtml = composedDisplayHtml || html
    const blob = new Blob([exportHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(selectedPage?.label || "wireframe").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [composedDisplayHtml, html, selectedPage])

  const handleSaveEdits = useCallback(() => {
    if (html.trim()) {
      handleFieldChange("zoningHtml", html.trim())
      setDisplayHtml(html.trim())
    }
  }, [html, handleFieldChange])

  // When not generating and html changes (code edit), sync displayHtml
  useEffect(() => {
    if (!isGenerating) setDisplayHtml(html)
  }, [html, isGenerating])

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Mobile page list overlay */}
      {showMobilePageList && (
        <div
          className="absolute inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowMobilePageList(false)}
        >
          <div
            className="w-[280px] h-full flex flex-col"
            style={{ background: "var(--surface)", borderRight: "1px solid var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <PageList nodes={nodes} selectedId={selectedPageId} onSelect={setSelectedPageId} generatingPageId={generatingPageId} unseenChanges={unseenChanges} />
          </div>
        </div>
      )}

      {/* Left: Page list + Global sections (desktop only) */}
      <div
        className="hidden md:flex w-[220px] shrink-0 flex-col"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--line)" }}
      >
        <PageList nodes={nodes} selectedId={selectedPageId} onSelect={setSelectedPageId} generatingPageId={generatingPageId} unseenChanges={unseenChanges} />

        {/* Global sections status */}
        {(hasGlobalHeader || hasGlobalFooter) && (
          <div className="px-3 py-2 shrink-0 flex flex-col gap-1" style={{ borderTop: "1px solid var(--line)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              Composants partag\u00e9s
            </span>
            {hasGlobalHeader && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--accent)" }}>&#10003; Header</span>
                {!readOnly && (
                  <button
                    onClick={() => saveGlobalSections(globalSections.filter(g => g.slot !== "header"))}
                    className="text-[10px] hover:underline px-1"
                    style={{ color: "var(--text-faint)" }}
                    title="Retirer le header global"
                  >&times;</button>
                )}
              </div>
            )}
            {hasGlobalFooter && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--accent)" }}>&#10003; Footer</span>
                {!readOnly && (
                  <button
                    onClick={() => saveGlobalSections(globalSections.filter(g => g.slot !== "footer"))}
                    className="text-[10px] hover:underline px-1"
                    style={{ color: "var(--text-faint)" }}
                    title="Retirer le footer global"
                  >&times;</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Wireframe */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-2 sm:px-4 py-2 shrink-0 gap-2"
          style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile page selector button */}
            <button
              onClick={() => setShowMobilePageList(true)}
              className="md:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium shrink-0"
              style={{ border: "1px solid var(--line)", color: "var(--text-secondary)" }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{selectedPage?.label || "Pages"}</span>
            </button>
            <span className="hidden md:block text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {selectedPage?.label || "S\u00e9lectionner une page"}
            </span>
            {isGenerating && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
                <span className="text-xs hidden sm:inline" style={{ color: "var(--accent)" }}>{generationStatus}</span>
              </div>
            )}
            {!isGenerating && generationStatus && (
              <span className="text-xs shrink-0 hidden sm:inline" style={{ color: "var(--error-text)" }}>{generationStatus}</span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View mode — code view hidden for guests */}
            {!readOnly ? (
              <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--bg-hover)" }}>
                <button
                  onClick={() => setViewMode("preview")}
                  className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-xs transition-all"
                  style={{
                    background: viewMode === "preview" ? "var(--elevated)" : "transparent",
                    color: viewMode === "preview" ? "var(--accent)" : "var(--text-faint)",
                    boxShadow: viewMode === "preview" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-xs transition-all"
                  style={{
                    background: viewMode === "code" ? "var(--elevated)" : "transparent",
                    color: viewMode === "code" ? "var(--accent)" : "var(--text-faint)",
                    boxShadow: viewMode === "code" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
              </div>
            ) : null}

            {/* Generate — hidden for read-only guests */}
            {selectedPage && !readOnly && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
                title={html ? "Reg\u00e9n\u00e9rer (Desktop + Tablet + Mobile)" : "G\u00e9n\u00e9rer (Desktop + Tablet + Mobile)"}
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : html ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{html ? "Reg\u00e9n\u00e9rer" : "G\u00e9n\u00e9rer"}</span>
              </button>
            )}

            {/* Copy — editors only */}
            {html && !readOnly && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: copied ? "var(--accent)" : "var(--accent-muted)",
                  color: copied ? "#fff" : "var(--accent)",
                }}
              >
                {copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copié !" : "Copier"}</span>
              </button>
            )}

            {/* Download — editors only */}
            {html && !readOnly && (
              <button
                onClick={handleDownload}
                className="hidden sm:flex p-1.5 rounded-lg text-xs transition-all"
                style={{ border: "1px solid var(--line)", color: "var(--text-secondary)" }}
                title={"Télécharger le fichier HTML"}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Annotations toggle */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="p-1.5 rounded-lg text-xs transition-all"
              style={{
                border: "1px solid var(--line)",
                color: showAnnotations ? "var(--accent)" : "var(--text-faint)",
                background: showAnnotations ? "var(--accent-muted)" : "transparent",
              }}
              title={showAnnotations ? "Masquer les commentaires" : "Commentaires"}
            >
              {showAnnotations ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content area */}
        {viewMode === "preview" ? (
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto flex justify-center p-2 sm:p-6 pb-10 relative"
            style={{ background: "var(--canvas-bg, #f0f0f0)" }}
          >
            {/* Generating overlay — shown during streaming, keeps existing preview visible underneath */}
            {isGenerating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.04)", backdropFilter: "blur(1px)" }}>
                <div className="flex flex-col items-center gap-3 p-6 rounded-2xl" style={{ background: "var(--elevated)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {generationStatus || "G\u00e9n\u00e9ration en cours..."}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--text-faint)" }}>
                    {streamProgress > 0 ? `${Math.round(streamProgress / 1000)}k caract\u00e8res` : ""}
                  </p>
                </div>
              </div>
            )}

            {composedDisplayHtml ? (
              <div className="relative" style={{ width: canvasWidth, maxWidth: "100%" }}>
                <div
                  className="rounded-lg overflow-hidden shadow-lg"
                  style={{ background: "#FFFFFF" }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={readOnly ? composedDisplayHtml : makeEditable(composedDisplayHtml)}
                    sandbox="allow-same-origin allow-scripts"
                    className="w-full border-0"
                    style={{ minHeight: "calc(100vh - 180px)" }}
                    title="Wireframe preview"
                  />
                </div>
                {/* Drag handle — right edge */}
                <div
                  onMouseDown={handleDragStart}
                  className="absolute top-0 -right-3 w-6 h-full flex items-center justify-center cursor-ew-resize group z-10"
                >
                  <div
                    className="w-1 h-12 rounded-full transition-all group-hover:h-20 group-hover:w-1.5"
                    style={{ background: "var(--text-faint)", opacity: 0.3 }}
                  />
                </div>
                {/* Width label */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono tabular-nums px-2 py-0.5 rounded"
                  style={{ background: "var(--surface)", color: "var(--text-faint)", border: "1px solid var(--line)" }}
                >
                  {Math.round(canvasWidth)}px
                </div>
              </div>
            ) : selectedPage && !isGenerating && !readOnly ? (
              <EmptyState onGenerate={handleGenerate} isGenerating={isGenerating} />
            ) : selectedPage && !isGenerating && readOnly ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>Aucun wireframe pour cette page.</p>
              </div>
            ) : !isGenerating ? (
              <div className="flex items-center justify-center flex-1">
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                  {"S\u00e9lectionnez une page \u00e0 gauche"}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <textarea
              ref={textareaRef}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 w-full p-5 font-mono text-xs leading-relaxed bg-transparent border-none outline-none resize-none"
              style={{ color: "var(--text-secondary)", caretColor: "var(--accent)", background: "var(--bg-surface)", tabSize: 2 }}
              spellCheck={false}
              placeholder={"Le HTML appara\u00eetra ici. Modifiez-le librement."}
            />
            <div
              className="px-5 py-2 flex items-center justify-between shrink-0"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                {"Modifiez le HTML librement, puis sauvegardez."}
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

        {/* Footer */}
        <div
          className="px-2 sm:px-4 py-1.5 shrink-0 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <span className="text-2xs hidden sm:inline" style={{ color: "var(--text-faint)" }}>
            Copiez le HTML &rarr; <strong>htmlto.design</strong> dans Figma &rarr; onglet Code &rarr; collez.
          </span>
          <span className="text-2xs sm:hidden" style={{ color: "var(--text-faint)" }}>
            HTML &rarr; <strong>htmlto.design</strong>
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
              {blocks.length > 0 ? `${blocks.length} section${blocks.length > 1 ? "s" : ""}` : ""}
            </span>

            {/* Viewport toggle */}
            {viewMode === "preview" && (
              <div className="flex items-center rounded-md p-0.5" style={{ background: "var(--bg-hover)" }}>
                {VIEWPORTS.map((vp) => {
                  const Icon = vp.icon
                  const isActive = viewport === vp.width
                  return (
                    <button
                      key={vp.width}
                      onClick={() => setViewport(vp.width as ViewportWidth)}
                      className="flex items-center gap-1 px-1.5 py-1 rounded text-2xs transition-all"
                      style={{
                        background: isActive ? "var(--elevated)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text-faint)",
                        boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                      }}
                      title={`${vp.label} (${vp.width}px)`}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  )
                })}
              </div>
            )}

            <span className="text-2xs font-mono tabular-nums" style={{ color: "var(--text-faint)" }}>
              {Math.round(canvasWidth)}px
            </span>
          </div>
        </div>
      </div>

      {/* Right: Comments panel — sidebar on desktop, overlay on mobile */}
      {showAnnotations && selectedPageId && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="absolute inset-0 z-10 md:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowAnnotations(false)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 z-10 w-[280px] md:relative md:w-[300px] shrink-0 overflow-y-auto p-4 flex flex-col"
            style={{ borderLeft: "1px solid var(--line)", background: "var(--elevated)" }}
          >
            <WireframeCommentsPanel
              projectId={project.id}
              nodeId={selectedPageId}
              currentUser={currentUser}
              detectedSections={detectedSections}
              highlightedSection={highlightedSection}
              onHoverSection={handleHoverAnnotation}
              onScrollToSection={handleScrollToSection}
              autoOpenSection={commentOnSection}
              onAutoOpenConsumed={() => setCommentOnSection(null)}
            />
          </div>
        </>
      )}
    </div>
  )
}
