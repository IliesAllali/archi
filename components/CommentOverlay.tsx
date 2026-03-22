"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useReactFlow } from "reactflow"
import { Send, Check, X, Loader2, Trash2, GripVertical } from "lucide-react"
import { useCommentsStore, type CanvasComment } from "@/store/comments-store"
import type { Node } from "reactflow"

// ─── Find nearest node to a canvas position ─────────────────────────────────

function findNearestNode(
  canvasX: number,
  canvasY: number,
  rfNodes: Node[],
): Node | null {
  let best: Node | null = null
  let bestDist = Infinity

  for (const n of rfNodes) {
    if (n.id.startsWith("ep_") || n.id.startsWith("__")) continue
    const cx = n.position.x + (n.width ?? 160) / 2
    const cy = n.position.y + (n.height ?? 60) / 2
    const dist = Math.sqrt((canvasX - cx) ** 2 + (canvasY - cy) ** 2)
    if (dist < bestDist) {
      bestDist = dist
      best = n
    }
  }
  return best
}

// ─── CommentPin (draggable) ─────────────────────────────────────────────────

interface PinProps {
  comment: CanvasComment
  index: number
  isActive: boolean
  onClick: () => void
  onDragStart: (commentId: string, e: React.MouseEvent) => void
  pinRef: (el: HTMLElement | null) => void
  isDragging: boolean
}

function CommentPin({ comment, index, isActive, onClick, onDragStart, pinRef, isDragging }: PinProps) {
  const replyCount = useCommentsStore(s =>
    s.comments.filter(c => c.parentId === comment.id).length
  )
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const didDrag = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    didDrag.current = false

    const handleMove = (me: MouseEvent) => {
      if (!mouseDownPos.current) return
      const dx = me.clientX - mouseDownPos.current.x
      const dy = me.clientY - mouseDownPos.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!didDrag.current) {
          didDrag.current = true
          onDragStart(comment.id, e)
        }
      }
    }

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      if (!didDrag.current) {
        onClick()
      }
      mouseDownPos.current = null
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
  }

  return (
    <button
      ref={pinRef}
      onMouseDown={handleMouseDown}
      className="absolute flex items-center justify-center z-30 group"
      style={{
        left: -9999,
        top: -9999,
        width: 28,
        height: 28,
        borderRadius: "50% 50% 50% 0",
        transform: `rotate(-45deg) scale(${isDragging ? 1.2 : 1})`,
        background: comment.resolved
          ? "var(--text-faint)"
          : "var(--accent)",
        opacity: comment.resolved ? 0.5 : 1,
        boxShadow: isDragging
          ? "0 0 0 3px var(--accent-muted), 0 8px 24px rgba(0,0,0,0.3)"
          : isActive
            ? "0 0 0 3px var(--accent-muted), 0 2px 8px rgba(0,0,0,0.2)"
            : "0 2px 6px rgba(0,0,0,0.15)",
        transition: "transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <span
        className="text-2xs font-bold text-white select-none"
        style={{ transform: "rotate(45deg)" }}
      >
        {replyCount > 0 ? replyCount + 1 : index + 1}
      </span>
    </button>
  )
}

// ─── CommentThread ───────────────────────────────────────────────────────────

interface ThreadProps {
  rootComment: CanvasComment
  projectId: string
  currentUser: { id: string; name: string } | null
  onClose: () => void
  threadRef: (el: HTMLElement | null) => void
}

function CommentThread({ rootComment, projectId, currentUser, onClose, threadRef }: ThreadProps) {
  const [content, setContent] = useState("")
  const [guestName, setGuestName] = useState("")
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const comments = useCommentsStore(s => s.comments)
  const replies = useMemo(
    () => comments.filter(c => c.parentId === rootComment.id).sort((a, b) => a.createdAt - b.createdAt),
    [comments, rootComment.id]
  )
  const addComment = useCommentsStore(s => s.addComment)
  const resolveComment = useCommentsStore(s => s.resolveComment)
  const deleteComment = useCommentsStore(s => s.deleteComment)

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Close on outside click (use ref to avoid re-registering)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        onCloseRef.current()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSubmit = async () => {
    const name = currentUser?.name || guestName.trim()
    if (!content.trim() || !name) return
    setSending(true)
    await addComment(projectId, {
      nodeId: rootComment.nodeId,
      content: content.trim(),
      authorName: name,
      offsetX: rootComment.offsetX,
      offsetY: rootComment.offsetY,
      parentId: rootComment.id,
    })
    setContent("")
    setSending(false)
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return "maintenant"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}j`
  }

  return (
    <div
      ref={(el) => { (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = el; threadRef(el) }}
      className="absolute z-50 w-[280px] rounded-xl overflow-hidden"
      style={{
        left: -9999,
        top: -9999,
        background: "var(--elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.98)",
        transition: "opacity 150ms ease, transform 150ms ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--line)" }}>
        <span className="text-2xs font-medium" style={{ color: "var(--text-faint)" }}>
          Thread
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); resolveComment(projectId, rootComment.id, !rootComment.resolved) }}
            className="p-1 rounded transition-colors hover:bg-[var(--surface-hover)]"
            title={rootComment.resolved ? "Rouvrir" : "Résoudre"}
            style={{ color: rootComment.resolved ? "var(--success-text)" : "var(--text-faint)" }}
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteComment(projectId, rootComment.id); onClose() }}
            className="p-1 rounded transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-faint)" }}
          >
            <Trash2 className="w-3 h-3 hover:text-red-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="p-1 rounded transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-faint)" }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Root comment + replies */}
      <div className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-2">
        {[rootComment, ...replies].map(c => (
          <div
            key={c.id}
            className={c.id === rootComment.id ? "" : "pl-2"}
            style={{
              ...(c.id !== rootComment.id ? { borderLeft: "2px solid var(--line)" } : {}),
              animation: "fadeIn 150ms ease",
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-2xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {c.authorName}
              </span>
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                {timeAgo(c.createdAt)}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {c.content}
            </p>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--line)" }}>
        {!currentUser && !guestName ? (
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="Ton nom"
            className="w-full h-7 px-2.5 rounded-md text-2xs focus:outline-none transition-colors"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
            onKeyDown={e => { if (e.key === "Enter" && guestName.trim()) inputRef.current?.focus() }}
          />
        ) : (
          <div className="flex gap-1.5">
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Répondre..."
              rows={1}
              className="flex-1 px-2.5 py-1.5 rounded-md text-2xs focus:outline-none resize-none transition-colors"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !sending) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleSubmit() }}
              disabled={sending || !content.trim()}
              className="self-end p-1.5 rounded-md transition-all disabled:opacity-40 shrink-0 hover:brightness-110"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── New comment input (when clicking canvas in comment mode) ────────────────

interface NewCommentProps {
  screenX: number
  screenY: number
  nodeId: string
  offsetX: number
  offsetY: number
  projectId: string
  currentUser: { id: string; name: string } | null
  onDone: () => void
}

function NewCommentInput({ screenX, screenY, nodeId, offsetX, offsetY, projectId, currentUser, onDone }: NewCommentProps) {
  const [content, setContent] = useState("")
  const [guestName, setGuestName] = useState("")
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const addComment = useCommentsStore(s => s.addComment)
  const openThread = useCommentsStore(s => s.openThread)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        onDoneRef.current()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSubmit = async () => {
    const name = currentUser?.name || guestName.trim()
    if (!content.trim() || !name) return
    setSending(true)
    const comment = await addComment(projectId, {
      nodeId,
      content: content.trim(),
      authorName: name,
      offsetX,
      offsetY,
    })
    setSending(false)
    if (comment) {
      openThread(comment.id)
    }
    onDone()
  }

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200
  const popoverLeft = screenX + 20 + 260 > viewportWidth ? screenX - 280 : screenX + 20
  const popoverTop = Math.max(8, screenY - 10)

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-[260px] rounded-xl overflow-hidden"
      style={{
        left: popoverLeft,
        top: popoverTop,
        background: "var(--elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.98)",
        transition: "opacity 150ms ease, transform 150ms ease",
      }}
    >
      <div className="px-3 py-2.5">
        {!currentUser && !guestName ? (
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="Ton nom"
            className="w-full h-8 px-2.5 rounded-md text-xs focus:outline-none transition-colors"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
            onKeyDown={e => { if (e.key === "Enter" && guestName.trim()) inputRef.current?.focus() }}
          />
        ) : (
          <div className="space-y-2">
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
              className="w-full px-2.5 py-2 rounded-md text-xs focus:outline-none resize-none transition-colors"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !sending) {
                  e.preventDefault()
                  handleSubmit()
                }
                if (e.key === "Escape") onDone()
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                Ctrl+Enter
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmit() }}
                disabled={sending || !content.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-2xs font-medium transition-all disabled:opacity-40 hover:brightness-110"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Poster
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Overlay ────────────────────────────────────────────────────────────

interface OverlayProps {
  projectId: string
  currentUser: { id: string; name: string } | null
  rfNodes: Node[]
}

export default function CommentOverlay({ projectId, currentUser, rfNodes }: OverlayProps) {
  const comments = useCommentsStore(s => s.comments)
  const commentMode = useCommentsStore(s => s.commentMode)
  const activeThreadId = useCommentsStore(s => s.activeThreadId)
  const openThread = useCommentsStore(s => s.openThread)
  const setCommentMode = useCommentsStore(s => s.setCommentMode)
  const fetchComments = useCommentsStore(s => s.fetchComments)
  const moveComment = useCommentsStore(s => s.moveComment)

  const [newComment, setNewComment] = useState<{
    screenX: number; screenY: number
    nodeId: string; offsetX: number; offsetY: number
  } | null>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const rf = useReactFlow()

  // DOM refs for pins and thread — we position them via rAF, no React re-renders
  const pinRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const threadRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    commentId: string
    startCanvasX: number
    startCanvasY: number
    origOffsetX: number
    origOffsetY: number
    nodeId: string
  } | null>(null)

  // Fetch comments on mount
  useEffect(() => {
    fetchComments(projectId)
  }, [projectId, fetchComments])

  // Escape to exit comment mode
  useEffect(() => {
    if (!commentMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCommentMode(false)
        setNewComment(null)
        openThread(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [commentMode, setCommentMode, openThread])

  // Handle canvas click in comment mode
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (!commentMode) return
    e.stopPropagation()

    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const screenX = e.clientX - bounds.left
    const screenY = e.clientY - bounds.top

    const canvasPos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })

    const nearest = findNearestNode(canvasPos.x, canvasPos.y, rfNodes)
    if (!nearest) return

    const nodeCx = nearest.position.x + (nearest.width ?? 160) / 2
    const nodeCy = nearest.position.y + (nearest.height ?? 60) / 2
    const offsetX = canvasPos.x - nodeCx
    const offsetY = canvasPos.y - nodeCy

    setNewComment({
      screenX, screenY,
      nodeId: nearest.id, offsetX, offsetY,
    })
    openThread(null)
  }, [commentMode, rf, rfNodes, openThread])

  // ─── Drag handling ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    setDraggingId(commentId)
    openThread(null)

    const rfNode = rfNodes.find(n => n.id === comment.nodeId)
    if (!rfNode) return

    const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
    const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2

    dragRef.current = {
      commentId,
      startCanvasX: nodeCx + comment.offsetX,
      startCanvasY: nodeCy + comment.offsetY,
      origOffsetX: comment.offsetX,
      origOffsetY: comment.offsetY,
      nodeId: comment.nodeId,
    }

    const handleMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const canvasPos = rf.screenToFlowPosition({ x: me.clientX, y: me.clientY })

      // Find nearest node to current drag position
      const nearest = findNearestNode(canvasPos.x, canvasPos.y, rfNodes)
      if (!nearest) return

      const nodeCx = nearest.position.x + (nearest.width ?? 160) / 2
      const nodeCy = nearest.position.y + (nearest.height ?? 60) / 2
      const newOffsetX = canvasPos.x - nodeCx
      const newOffsetY = canvasPos.y - nodeCy

      dragRef.current.nodeId = nearest.id
      dragRef.current.origOffsetX = newOffsetX
      dragRef.current.origOffsetY = newOffsetY

      // Live update pin position via DOM (no React re-render)
      const el = pinRefs.current.get(commentId)
      const container = containerRef.current
      if (el && container) {
        const bounds = container.getBoundingClientRect()
        const screenPos = rf.flowToScreenPosition({ x: canvasPos.x, y: canvasPos.y })
        el.style.left = `${screenPos.x - bounds.left - 14}px`
        el.style.top = `${screenPos.y - bounds.top - 14}px`
      }
    }

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      if (dragRef.current) {
        const { commentId, origOffsetX, origOffsetY, nodeId } = dragRef.current
        // Update store + API
        const c = comments.find(cc => cc.id === commentId)
        if (c && (c.offsetX !== origOffsetX || c.offsetY !== origOffsetY || c.nodeId !== nodeId)) {
          moveComment(projectId, commentId, origOffsetX, origOffsetY)
        }
        dragRef.current = null
      }
      setDraggingId(null)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
  }, [comments, rfNodes, rf, moveComment, projectId, openThread])

  // Only show root comments as pins (not replies)
  const rootComments = comments.filter(c => !c.parentId)

  // ─── rAF-based positioning — NO React state, NO re-renders ───────────────
  useEffect(() => {
    let running = true

    function updatePositions() {
      if (!running) return
      const container = containerRef.current
      if (!container) {
        requestAnimationFrame(updatePositions)
        return
      }
      const bounds = container.getBoundingClientRect()

      // Position each pin
      for (const comment of rootComments) {
        // Skip dragging pin — positioned via mouse handler
        if (draggingId === comment.id) continue

        const el = pinRefs.current.get(comment.id)
        if (!el) continue

        const rfNode = rfNodes.find(n => n.id === comment.nodeId)
        if (!rfNode) {
          el.style.left = "-9999px"
          continue
        }

        const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
        const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2
        const canvasX = nodeCx + comment.offsetX
        const canvasY = nodeCy + comment.offsetY
        const screenPos = rf.flowToScreenPosition({ x: canvasX, y: canvasY })

        el.style.left = `${screenPos.x - bounds.left - 14}px`
        el.style.top = `${screenPos.y - bounds.top - 14}px`
      }

      // Position thread popover
      const threadEl = threadRef.current
      if (threadEl && activeThreadId) {
        const root = rootComments.find(c => c.id === activeThreadId)
        if (root) {
          const rfNode = rfNodes.find(n => n.id === root.nodeId)
          if (rfNode) {
            const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
            const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2
            const canvasX = nodeCx + root.offsetX
            const canvasY = nodeCy + root.offsetY
            const screenPos = rf.flowToScreenPosition({ x: canvasX, y: canvasY })
            const sx = screenPos.x - bounds.left
            const sy = screenPos.y - bounds.top

            const viewportWidth = window.innerWidth
            const popoverLeft = sx + 20 + 280 > viewportWidth ? sx - 300 : sx + 20
            const popoverTop = Math.max(8, Math.min(sy - 20, window.innerHeight - 400))

            threadEl.style.left = `${popoverLeft}px`
            threadEl.style.top = `${popoverTop}px`
          }
        }
      }

      requestAnimationFrame(updatePositions)
    }

    requestAnimationFrame(updatePositions)
    return () => { running = false }
  }) // runs every render to pick up latest rootComments/rfNodes/activeThreadId

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pinPop { 0% { transform: rotate(-45deg) scale(0); } 60% { transform: rotate(-45deg) scale(1.15); } 100% { transform: rotate(-45deg) scale(1); } }
      `}</style>

      <div
        ref={containerRef}
        className="comment-overlay-container absolute inset-0 pointer-events-none"
        style={{
          zIndex: 50,
          cursor: commentMode ? "crosshair" : undefined,
          pointerEvents: commentMode ? "auto" : "none",
        }}
        onClick={handleOverlayClick}
      >
        {/* Render pins */}
        {rootComments.map((comment, i) => (
          <div key={comment.id} style={{ pointerEvents: "auto" }}>
            <CommentPin
              comment={comment}
              index={i}
              isActive={activeThreadId === comment.id}
              isDragging={draggingId === comment.id}
              onClick={() => {
                if (activeThreadId === comment.id) {
                  openThread(null)
                } else {
                  openThread(comment.id)
                  setNewComment(null)
                }
              }}
              onDragStart={handleDragStart}
              pinRef={(el) => { pinRefs.current.set(comment.id, el) }}
            />
          </div>
        ))}

        {/* Active thread popover */}
        {activeThreadId && (() => {
          const root = rootComments.find(c => c.id === activeThreadId)
          if (!root) return null
          return (
            <div style={{ pointerEvents: "auto" }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <CommentThread
                rootComment={root}
                projectId={projectId}
                currentUser={currentUser}
                onClose={() => openThread(null)}
                threadRef={(el) => { threadRef.current = el }}
              />
            </div>
          )
        })()}

        {/* New comment input */}
        {newComment && (
          <div style={{ pointerEvents: "auto" }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <NewCommentInput
              screenX={newComment.screenX}
              screenY={newComment.screenY}
              nodeId={newComment.nodeId}
              offsetX={newComment.offsetX}
              offsetY={newComment.offsetY}
              projectId={projectId}
              currentUser={currentUser}
              onDone={() => setNewComment(null)}
            />
          </div>
        )}
      </div>
    </>
  )
}
