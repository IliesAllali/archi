"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useReactFlow } from "reactflow"
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

// ─── Styles (injected once) ─────────────────────────────────────────────────

const OVERLAY_STYLES = `
@keyframes pinDrop {
  0% { transform: rotate(-45deg) scale(0) translateY(-8px); opacity: 0; }
  50% { transform: rotate(-45deg) scale(1.15) translateY(0); opacity: 1; }
  70% { transform: rotate(-45deg) scale(0.95); }
  100% { transform: rotate(-45deg) scale(1); }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.comment-pin-wrap:not(.is-dragging):hover .comment-preview {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}
.comment-pin-wrap:not(.is-dragging):hover .pin-core {
  transform: rotate(-45deg) scale(1.1);
  box-shadow: 0 0 0 2.5px var(--accent-muted), 0 4px 12px rgba(0,0,0,0.22);
}
.pin-core {
  transition: width 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
              height 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
              border-radius 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 200ms ease,
              opacity 200ms ease;
}
.comment-preview {
  opacity: 0;
  transform: translateX(-4px) scale(0.95);
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.thread-enter {
  animation: fadeSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.reply-enter {
  animation: fadeIn 200ms ease both;
}
`

// ─── CommentPin (draggable + hover preview) ─────────────────────────────────

interface PinProps {
  comment: CanvasComment
  index: number
  isActive: boolean
  onClick: () => void
  onDragStart: (commentId: string) => void
  pinRef: (el: HTMLElement | null) => void
  isDragging: boolean
  previewRef: (el: HTMLElement | null) => void
}

function CommentPin({ comment, index, isActive, onClick, onDragStart, pinRef, isDragging, previewRef }: PinProps) {
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
          onDragStart(comment.id)
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

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return "now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max) + "\u2026" : s

  return (
    <div
      ref={pinRef}
      className={`absolute z-30 comment-pin-wrap${isDragging ? " is-dragging" : ""}`}
      style={{
        left: -9999,
        top: -9999,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pin — teardrop 22px default, morphs to 14px circle on drag */}
      <div
        className="pin-core flex items-center justify-center"
        style={{
          width: isDragging ? 14 : 22,
          height: isDragging ? 14 : 22,
          borderRadius: isDragging ? "50%" : "50% 50% 50% 0",
          transform: isDragging ? "rotate(0deg) scale(1)" : "rotate(-45deg) scale(1)",
          background: comment.resolved ? "var(--text-faint)" : "var(--accent)",
          opacity: comment.resolved ? 0.55 : 1,
          boxShadow: isDragging
            ? "0 0 0 4px var(--accent-muted), 0 2px 12px rgba(0,0,0,0.3)"
            : isActive
              ? "0 0 0 2.5px var(--accent-muted), 0 2px 6px rgba(0,0,0,0.18)"
              : "0 1.5px 4px rgba(0,0,0,0.15)",
          cursor: isDragging ? "grabbing" : "grab",
          animation: isDragging ? "none" : "pinDrop 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        <span
          className="font-bold text-white select-none"
          style={{
            fontSize: isDragging ? 0 : 9,
            lineHeight: 1,
            transform: isDragging ? "rotate(0deg)" : "rotate(45deg)",
            opacity: isDragging ? 0 : 1,
            transition: "font-size 250ms ease, opacity 200ms ease, transform 250ms ease",
          }}
        >
          {replyCount > 0 ? replyCount + 1 : index + 1}
        </span>
      </div>

      {/* Hover preview bubble */}
      {!isDragging && !isActive && (
        <div
          ref={previewRef}
          className="comment-preview absolute rounded-lg"
          style={{
            left: 26,
            top: -4,
            width: 190,
            padding: "6px 8px",
            background: "var(--elevated)",
            border: "1px solid var(--line-strong)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
            zIndex: 40,
          }}
        >
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-semibold" style={{ fontSize: 10, color: "var(--text-secondary)" }}>
              {comment.authorName}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
              {timeAgo(comment.createdAt)}
            </span>
            {replyCount > 0 && (
              <span className="ml-auto px-1 rounded" style={{ fontSize: 9, background: "var(--surface-hover)", color: "var(--text-faint)" }}>
                +{replyCount}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.35, color: "var(--text-primary)" }}>
            {truncate(comment.content, 70)}
          </p>
        </div>
      )}
    </div>
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

const GUEST_NAME_KEY = "arbo_guest_name"

function CommentThread({ rootComment, projectId, currentUser, onClose, threadRef }: ThreadProps) {
  const [content, setContent] = useState("")
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_NAME_KEY) || ""
    return ""
  })
  const [guestConfirmed, setGuestConfirmed] = useState(() => !!guestName)
  const [sending, setSending] = useState(false)
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

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
  }, [])

  // Close on outside click
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
      className="absolute z-50 w-[248px] rounded-lg overflow-hidden thread-enter"
      style={{
        left: -9999,
        top: -9999,
        background: "var(--elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: rootComment.resolved ? "var(--text-faint)" : "var(--accent)" }} />
          <span className="font-medium" style={{ fontSize: 10, color: "var(--text-faint)" }}>
            Thread
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); resolveComment(projectId, rootComment.id, !rootComment.resolved) }}
            className="p-1 rounded transition-all hover:bg-[var(--surface-hover)] active:scale-90"
            title={rootComment.resolved ? "Rouvrir" : "Résoudre"}
            style={{ color: rootComment.resolved ? "var(--success-text)" : "var(--text-faint)" }}
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteComment(projectId, rootComment.id); onClose() }}
            className="p-1 rounded transition-all hover:bg-red-500/10 active:scale-90"
            style={{ color: "var(--text-faint)" }}
          >
            <Trash2 className="w-3 h-3 hover:text-red-400 transition-colors" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="p-1 rounded transition-all hover:bg-[var(--surface-hover)] active:scale-90"
            style={{ color: "var(--text-faint)" }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Root comment + replies */}
      <div className="max-h-[220px] overflow-y-auto px-2.5 py-2 space-y-2">
        {[rootComment, ...replies].map((c, idx) => (
          <div
            key={c.id}
            className={`reply-enter ${c.id === rootComment.id ? "" : "pl-2 ml-0.5"}`}
            style={{
              ...(c.id !== rootComment.id ? { borderLeft: "2px solid var(--line)" } : {}),
              animationDelay: `${idx * 40}ms`,
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-semibold" style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                {c.authorName}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                {timeAgo(c.createdAt)}
              </span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.4, color: "var(--text-primary)" }}>
              {c.content}
            </p>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="px-2.5 py-2" style={{ borderTop: "1px solid var(--line)" }}>
        {!currentUser && !guestConfirmed ? (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Pr\u00E9nom ou pseudo"
              className="flex-1 h-6 px-2 rounded text-2xs focus:outline-none transition-all"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-muted)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
              onKeyDown={e => {
                if (e.key === "Enter" && guestName.trim().length >= 2) {
                  localStorage.setItem(GUEST_NAME_KEY, guestName.trim())
                  setGuestConfirmed(true)
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (guestName.trim().length >= 2) {
                  localStorage.setItem(GUEST_NAME_KEY, guestName.trim())
                  setGuestConfirmed(true)
                }
              }}
              disabled={guestName.trim().length < 2}
              className="px-2 h-6 rounded text-2xs font-medium transition-all disabled:opacity-30"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="R\u00E9pondre..."
              rows={1}
              className="flex-1 px-2 py-1 rounded text-2xs focus:outline-none resize-none transition-all"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-muted)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
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
              className="self-end p-1 rounded transition-all disabled:opacity-30 shrink-0 active:scale-90"
              style={{
                background: content.trim() ? "var(--accent)" : "var(--surface-hover)",
                color: content.trim() ? "#fff" : "var(--text-faint)",
              }}
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── New comment input ──────────────────────────────────────────────────────

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
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_NAME_KEY) || ""
    return ""
  })
  const [guestConfirmed, setGuestConfirmed] = useState(() => !!guestName)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const addComment = useCommentsStore(s => s.addComment)
  const openThread = useCommentsStore(s => s.openThread)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
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
      className="absolute z-50 w-[230px] rounded-lg overflow-hidden thread-enter"
      style={{
        left: popoverLeft,
        top: popoverTop,
        background: "var(--elevated)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <div className="px-2.5 py-2">
        {!currentUser && !guestConfirmed ? (
          <div className="space-y-1.5">
            <p className="text-2xs" style={{ color: "var(--text-muted)" }}>Comment souhaitez-vous apparaitre ?</p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Pr\u00E9nom ou pseudo"
                className="flex-1 h-6 px-2 rounded text-2xs focus:outline-none transition-all"
                style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-muted)" }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
                onKeyDown={e => {
                  if (e.key === "Enter" && guestName.trim().length >= 2) {
                    localStorage.setItem(GUEST_NAME_KEY, guestName.trim())
                    setGuestConfirmed(true)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => {
                  if (guestName.trim().length >= 2) {
                    localStorage.setItem(GUEST_NAME_KEY, guestName.trim())
                    setGuestConfirmed(true)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }
                }}
                disabled={guestName.trim().length < 2}
                className="px-2 h-6 rounded text-2xs font-medium transition-all disabled:opacity-30"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <textarea
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
              className="w-full px-2 py-1.5 rounded text-2xs focus:outline-none resize-none transition-all"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-muted)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "none" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !sending) {
                  e.preventDefault()
                  handleSubmit()
                }
                if (e.key === "Escape") onDone()
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmit() }}
                disabled={sending || !content.trim()}
                className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium transition-all disabled:opacity-30 active:scale-95"
                style={{
                  background: content.trim() ? "var(--accent)" : "var(--surface-hover)",
                  color: content.trim() ? "#fff" : "var(--text-faint)",
                }}
              >
                {sending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
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

  const pinRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const previewRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  const threadRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    commentId: string
    nodeId: string
    nodeCx: number
    nodeCy: number
  } | null>(null)

  // Fetch comments on mount + poll every 5s for live updates
  useEffect(() => {
    fetchComments(projectId)
    const interval = setInterval(() => fetchComments(projectId), 5000)
    return () => clearInterval(interval)
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

  // Auto-exit comment mode when clicking outside canvas (modals, panels, toolbar)
  useEffect(() => {
    if (!commentMode) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // If click is inside a modal, panel, toolbar, or any non-canvas UI — exit comment mode
      if (
        target.closest("[role=\"dialog\"]") ||
        target.closest("[data-panel]") ||
        target.closest("[data-toolbar]") ||
        target.closest("[data-no-comment]") ||
        target.closest(".fixed:not(.comment-overlay-container)")
      ) {
        setCommentMode(false)
        setNewComment(null)
        openThread(null)
      }
    }
    window.addEventListener("mousedown", handler, true)
    return () => window.removeEventListener("mousedown", handler, true)
  }, [commentMode, setCommentMode, openThread])

  // Handle canvas click in comment mode
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (!commentMode) return

    // Don't place comment if clicking on interactive UI elements
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("[role=\"dialog\"]") ||
      target.closest("[role=\"menu\"]") ||
      target.closest("[role=\"menuitem\"]") ||
      target.closest(".comment-thread") ||
      target.closest(".comment-input") ||
      target.closest(".comment-pin-wrap") ||
      target.closest("[data-no-comment]")
    ) return

    e.stopPropagation()

    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const screenX = e.clientX - bounds.left
    const screenY = e.clientY - bounds.top

    const canvasPos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })

    const nearest = findNearestNode(canvasPos.x, canvasPos.y, rfNodes)
    if (!nearest) return

    const nodeCx = nearest.position.x + (nearest.width ?? 160) / 2
    const nodeCy = nearest.position.y + (nearest.height ?? 60) / 2

    setNewComment({
      screenX, screenY,
      nodeId: nearest.id,
      offsetX: canvasPos.x - nodeCx,
      offsetY: canvasPos.y - nodeCy,
    })
    openThread(null)
  }, [commentMode, rf, rfNodes, openThread])

  // ─── Drag handling (keeps same node, only updates offset) ──────────────────
  const handleDragStart = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    setDraggingId(commentId)
    openThread(null)

    // Lock to the original node
    const rfNode = rfNodes.find(n => n.id === comment.nodeId)
    if (!rfNode) return

    const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
    const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2

    dragRef.current = { commentId, nodeId: comment.nodeId, nodeCx, nodeCy }

    let lastOffsetX = comment.offsetX
    let lastOffsetY = comment.offsetY

    const handleMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const canvasPos = rf.screenToFlowPosition({ x: me.clientX, y: me.clientY })

      // Offset relative to the SAME node center (no node switching)
      lastOffsetX = canvasPos.x - dragRef.current.nodeCx
      lastOffsetY = canvasPos.y - dragRef.current.nodeCy

      // Live DOM update
      const el = pinRefs.current.get(commentId)
      const container = containerRef.current
      if (el && container) {
        const bounds = container.getBoundingClientRect()
        const screenPos = rf.flowToScreenPosition({ x: canvasPos.x, y: canvasPos.y })
        el.style.left = `${screenPos.x - bounds.left - 11}px`
        el.style.top = `${screenPos.y - bounds.top - 11}px`
      }
    }

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)

      if (dragRef.current) {
        const orig = comments.find(c => c.id === commentId)
        if (orig && (orig.offsetX !== lastOffsetX || orig.offsetY !== lastOffsetY)) {
          moveComment(projectId, commentId, lastOffsetX, lastOffsetY)
        }
        dragRef.current = null
      }
      setDraggingId(null)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
  }, [comments, rfNodes, rf, moveComment, projectId, openThread])

  // Root comments only
  const rootComments = comments.filter(c => !c.parentId)

  // ─── rAF positioning ──────────────────────────────────────────────────────
  useEffect(() => {
    let running = true

    function updatePositions() {
      if (!running) return
      const container = containerRef.current
      if (!container) { requestAnimationFrame(updatePositions); return }
      const bounds = container.getBoundingClientRect()

      for (const comment of rootComments) {
        if (draggingId === comment.id) continue

        const el = pinRefs.current.get(comment.id)
        if (!el) continue

        const rfNode = rfNodes.find(n => n.id === comment.nodeId)
        if (!rfNode) { el.style.left = "-9999px"; continue }

        const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
        const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2
        const screenPos = rf.flowToScreenPosition({
          x: nodeCx + comment.offsetX,
          y: nodeCy + comment.offsetY,
        })

        el.style.left = `${screenPos.x - bounds.left - 11}px`
        el.style.top = `${screenPos.y - bounds.top - 11}px`

        // Clamp preview bubble to viewport
        const preview = previewRefs.current.get(comment.id)
        if (preview) {
          const pinScreenX = screenPos.x - bounds.left
          const spaceRight = window.innerWidth - (bounds.left + pinScreenX + 32)
          if (spaceRight < 220) {
            preview.style.left = "auto"
            preview.style.right = "32px"
          } else {
            preview.style.left = "32px"
            preview.style.right = "auto"
          }
        }
      }

      // Position thread
      const threadEl = threadRef.current
      if (threadEl && activeThreadId) {
        const root = rootComments.find(c => c.id === activeThreadId)
        if (root) {
          const rfNode = rfNodes.find(n => n.id === root.nodeId)
          if (rfNode) {
            const nodeCx = rfNode.position.x + (rfNode.width ?? 160) / 2
            const nodeCy = rfNode.position.y + (rfNode.height ?? 60) / 2
            const screenPos = rf.flowToScreenPosition({
              x: nodeCx + root.offsetX,
              y: nodeCy + root.offsetY,
            })
            const sx = screenPos.x - bounds.left
            const sy = screenPos.y - bounds.top

            const viewportW = window.innerWidth
            const popoverLeft = sx + 20 + 280 > viewportW ? sx - 300 : sx + 20
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
  })

  return (
    <>
      <style>{OVERLAY_STYLES}</style>

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
              previewRef={(el) => { previewRefs.current.set(comment.id, el) }}
            />
          </div>
        ))}

        {/* Active thread */}
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
