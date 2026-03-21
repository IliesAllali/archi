"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useReactFlow, useOnViewportChange, type Viewport } from "reactflow"
import { Send, Check, X, Loader2, Trash2 } from "lucide-react"
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

// ─── CommentPin ──────────────────────────────────────────────────────────────

interface PinProps {
  comment: CanvasComment
  screenX: number
  screenY: number
  index: number
  isActive: boolean
  onClick: () => void
}

function CommentPin({ comment, screenX, screenY, index, isActive, onClick }: PinProps) {
  const replyCount = useCommentsStore(s =>
    s.comments.filter(c => c.parentId === comment.id).length
  )

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="absolute flex items-center justify-center transition-all duration-150 hover:scale-110 z-30"
      style={{
        left: screenX - 14,
        top: screenY - 14,
        width: 28,
        height: 28,
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        background: comment.resolved
          ? "var(--text-faint)"
          : isActive ? "var(--accent)" : "var(--accent)",
        opacity: comment.resolved ? 0.5 : 1,
        boxShadow: isActive
          ? "0 0 0 3px var(--accent-muted), 0 2px 8px rgba(0,0,0,0.2)"
          : "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      <span
        className="text-2xs font-bold text-white"
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
  screenX: number
  screenY: number
  currentUser: { id: string; name: string } | null
  onClose: () => void
}

function CommentThread({ rootComment, projectId, screenX, screenY, currentUser, onClose }: ThreadProps) {
  const [content, setContent] = useState("")
  const [guestName, setGuestName] = useState("")
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const replies = useCommentsStore(s =>
    s.comments.filter(c => c.parentId === rootComment.id).sort((a, b) => a.createdAt - b.createdAt)
  )
  const addComment = useCommentsStore(s => s.addComment)
  const resolveComment = useCommentsStore(s => s.resolveComment)
  const deleteComment = useCommentsStore(s => s.deleteComment)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

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

  // Position the thread popover to the right of the pin
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200
  const popoverLeft = screenX + 20 + 280 > viewportWidth ? screenX - 300 : screenX + 20
  const popoverTop = Math.max(8, Math.min(screenY - 20, (typeof window !== "undefined" ? window.innerHeight : 800) - 400))

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-[280px] rounded-xl overflow-hidden"
      style={{
        left: popoverLeft,
        top: popoverTop,
        background: "var(--elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--line)" }}>
        <span className="text-2xs font-medium" style={{ color: "var(--text-faint)" }}>
          Thread
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => resolveComment(projectId, rootComment.id, !rootComment.resolved)}
            className="p-1 rounded transition-colors"
            title={rootComment.resolved ? "Rouvrir" : "Résoudre"}
            style={{ color: rootComment.resolved ? "var(--success-text)" : "var(--text-faint)" }}
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => { deleteComment(projectId, rootComment.id); onClose() }}
            className="p-1 rounded hover:text-red-400 transition-colors"
            style={{ color: "var(--text-faint)" }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--text-faint)" }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Root comment + replies */}
      <div className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-2">
        {[rootComment, ...replies].map(c => (
          <div key={c.id} className={c.id === rootComment.id ? "" : "pl-2"} style={c.id !== rootComment.id ? { borderLeft: "2px solid var(--line)" } : {}}>
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
            className="w-full h-7 px-2.5 rounded-md text-2xs focus:outline-none"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
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
              className="flex-1 px-2.5 py-1.5 rounded-md text-2xs focus:outline-none resize-none"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !sending) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={sending || !content.trim()}
              className="self-end p-1.5 rounded-md transition-all disabled:opacity-40 shrink-0"
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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const addComment = useCommentsStore(s => s.addComment)
  const openThread = useCommentsStore(s => s.openThread)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        onDone()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onDone])

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
      }}
    >
      <div className="px-3 py-2.5">
        {!currentUser && !guestName ? (
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="Ton nom"
            className="w-full h-8 px-2.5 rounded-md text-xs focus:outline-none"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
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
              className="w-full px-2.5 py-2 rounded-md text-xs focus:outline-none resize-none"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
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
                onClick={handleSubmit}
                disabled={sending || !content.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-2xs font-medium transition-all disabled:opacity-40"
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

  const [newComment, setNewComment] = useState<{
    screenX: number; screenY: number
    nodeId: string; offsetX: number; offsetY: number
  } | null>(null)

  const rf = useReactFlow()

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

    // Convert screen position to canvas (flow) position
    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const screenX = e.clientX - bounds.left
    const screenY = e.clientY - bounds.top

    const canvasPos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })

    // Find nearest node
    const nearest = findNearestNode(canvasPos.x, canvasPos.y, rfNodes)
    if (!nearest) return

    // Calculate offset from node center
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

  // Convert canvas position to screen position for a comment
  const getScreenPos = useCallback((comment: CanvasComment) => {
    // Find the node this comment is attached to
    const rfNode = rfNodes.find(n => n.id === comment.nodeId)
    if (!rfNode) return null

    const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
    const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2
    const canvasX = nodeCx + comment.offsetX
    const canvasY = nodeCy + comment.offsetY

    const screenPos = rf.flowToScreenPosition({ x: canvasX, y: canvasY })
    // Get container bounds
    const container = document.querySelector(".comment-overlay-container")
    if (!container) return null
    const bounds = container.getBoundingClientRect()
    return {
      x: screenPos.x - bounds.left,
      y: screenPos.y - bounds.top,
    }
  }, [rfNodes, rf])

  // Only show root comments as pins (not replies)
  const rootComments = comments.filter(c => !c.parentId)

  // Re-render when viewport changes (pan/zoom) — throttled via rAF to avoid loops
  const [, setTick] = useState(0)
  const rafRef = useRef(0)
  const vpRef = useRef("")
  const handleViewportChange = useCallback((vp: Viewport) => {
    // Only re-render if viewport actually changed (prevents infinite loops)
    const key = `${vp.x.toFixed(1)},${vp.y.toFixed(1)},${vp.zoom.toFixed(3)}`
    if (key === vpRef.current) return
    vpRef.current = key
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setTick(t => t + 1))
  }, [])
  useOnViewportChange({ onChange: handleViewportChange })

  return (
    <div
      className="comment-overlay-container absolute inset-0 pointer-events-none"
      style={{
        zIndex: 20,
        cursor: commentMode ? "crosshair" : undefined,
        pointerEvents: commentMode ? "auto" : undefined,
      }}
      onClick={handleOverlayClick}
    >
      {/* Render pins */}
      {rootComments.map((comment, i) => {
        const pos = getScreenPos(comment)
        if (!pos) return null
        return (
          <div key={comment.id} style={{ pointerEvents: "auto" }}>
            <CommentPin
              comment={comment}
              screenX={pos.x}
              screenY={pos.y}
              index={i}
              isActive={activeThreadId === comment.id}
              onClick={() => {
                if (activeThreadId === comment.id) {
                  openThread(null)
                } else {
                  openThread(comment.id)
                  setNewComment(null)
                }
              }}
            />
          </div>
        )
      })}

      {/* Active thread popover */}
      {activeThreadId && (() => {
        const root = rootComments.find(c => c.id === activeThreadId)
        if (!root) return null
        const pos = getScreenPos(root)
        if (!pos) return null
        return (
          <div style={{ pointerEvents: "auto" }}>
            <CommentThread
              rootComment={root}
              projectId={projectId}
              screenX={pos.x}
              screenY={pos.y}
              currentUser={currentUser}
              onClose={() => openThread(null)}
            />
          </div>
        )
      })()}

      {/* New comment input */}
      {newComment && (
        <div style={{ pointerEvents: "auto" }}>
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
  )
}
