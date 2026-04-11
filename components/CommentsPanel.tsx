"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, MessageCircle, Check, Loader2, MapPin } from "lucide-react"
import { useCommentsStore } from "@/store/comments-store"

interface Props {
  projectId: string
  nodeId: string | null
  nodeLabel: string | null
  open: boolean
  onClose: () => void
  currentUser?: { id: string; name: string } | null
  nodeLabels?: Record<string, string>
}

const GUEST_NAME_KEY = "arbo_guest_name"

export default function CommentsPanel({ projectId, nodeId, nodeLabel, open, onClose, currentUser, nodeLabels = {} }: Props) {
  const [content, setContent] = useState("")
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_NAME_KEY) || ""
    return ""
  })
  const [guestConfirmed, setGuestConfirmed] = useState(() => !!guestName)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Shared store
  const storeComments = useCommentsStore(s => s.comments)
  const loading = useCommentsStore(s => s.loading)
  const fetchComments = useCommentsStore(s => s.fetchComments)
  const addComment = useCommentsStore(s => s.addComment)
  const resolveComment = useCommentsStore(s => s.resolveComment)
  const openThread = useCommentsStore(s => s.openThread)
  const activeThreadId = useCommentsStore(s => s.activeThreadId)

  // Filter comments for this node (root only, no replies) — or all if no node
  const comments = useMemo(
    () => storeComments
      .filter(c => !c.parentId && (nodeId ? c.nodeId === nodeId : true))
      .sort((a, b) => a.createdAt - b.createdAt),
    [storeComments, nodeId]
  )

  // Fetch from shared store on open
  useEffect(() => {
    if (open) {
      fetchComments(projectId)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, fetchComments, projectId])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments])

  const handleSubmit = async () => {
    if (!content.trim() || !nodeId) return
    const name = currentUser?.name || guestName.trim()
    if (!name) return

    setSending(true)
    await addComment(projectId, {
      nodeId,
      content: content.trim(),
      authorName: name,
      offsetX: 0,
      offsetY: 0,
    })
    setContent("")
    setSending(false)
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await resolveComment(projectId, commentId, resolved)
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return "maintenant"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}j`
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 right-0 bottom-0 w-[320px] z-40 flex flex-col"
          style={{
            background: "var(--surface)",
            borderLeft: "1px solid var(--line)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-11 shrink-0" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {nodeLabel || "Tous les commentaires"}
              </span>
              {comments.length > 0 && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-hover)", color: "var(--text-faint)" }}>
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md transition-[background-color,transform] duration-150 ease-out hover:bg-[var(--surface-hover)] active:scale-[0.93]" style={{ color: "var(--text-faint)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comments list */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-faint)" }} />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  {nodeId ? "Aucun commentaire sur cette page." : "Aucun commentaire dans ce projet."}
                </p>
              </div>
            ) : (
              comments.map(comment => {
                const replyCount = storeComments.filter(c => c.parentId === comment.id).length
                const isHighlighted = activeThreadId === comment.id
                return (
                  <div
                    key={comment.id}
                    className="rounded-lg p-3 transition-[background-color,border-color,opacity] duration-150 cursor-pointer"
                    style={{
                      background: isHighlighted ? "var(--accent-muted)" : comment.resolved ? "transparent" : "var(--elevated)",
                      border: `1px solid ${isHighlighted ? "var(--accent)" : comment.resolved ? "var(--line)" : "var(--line-strong)"}`,
                      opacity: comment.resolved ? 0.5 : 1,
                    }}
                    onClick={() => openThread(isHighlighted ? null : comment.id)}
                  >
                    {!nodeId && nodeLabels[comment.nodeId] && (
                      <p className="text-2xs mb-1 truncate" style={{ color: "var(--accent)", opacity: 0.7 }}>
                        {nodeLabels[comment.nodeId]}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {comment.authorName}
                      </span>
                      <div className="flex items-center gap-1">
                        {replyCount > 0 && (
                          <span className="text-2xs px-1 rounded" style={{ color: "var(--text-faint)", background: "var(--surface-hover)" }}>
                            {replyCount} {replyCount === 1 ? "reply" : "replies"}
                          </span>
                        )}
                        <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                          {timeAgo(comment.createdAt)}
                        </span>
                        {currentUser && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResolve(comment.id, !comment.resolved) }}
                            className="p-0.5 rounded transition-colors hover:bg-[var(--surface-hover)]"
                            title={comment.resolved ? "Rouvrir" : "Résoudre"}
                            style={{ color: comment.resolved ? "var(--success-text)" : "var(--text-faint)" }}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openThread(comment.id) }}
                          className="p-0.5 rounded transition-colors hover:bg-[var(--surface-hover)]"
                          title="Voir sur le canvas"
                          style={{ color: "var(--text-faint)" }}
                        >
                          <MapPin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {comment.content}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--line)" }}>
            {!currentUser && !guestConfirmed ? (
              <div className="flex flex-col gap-2">
                <p className="text-2xs" style={{ color: "var(--text-muted)" }}>Comment souhaitez-vous apparaitre ?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Pr\u00E9nom ou pseudo"
                    className="flex-1 h-8 px-3 rounded-lg text-xs focus:outline-none transition-colors"
                    style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
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
                    className="px-3 h-8 rounded-lg text-xs font-medium transition-[transform,filter] duration-150 ease-out disabled:opacity-40 hover:brightness-110 active:scale-[0.97]"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    OK
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none resize-none transition-colors"
                    style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
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
                    onClick={handleSubmit}
                    disabled={sending || !content.trim()}
                    className="self-end p-2.5 rounded-lg transition-[transform,filter] duration-150 ease-out disabled:opacity-40 shrink-0 hover:brightness-110 active:scale-[0.93]"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {!currentUser && guestConfirmed && (
                  <button
                    onClick={() => { setGuestConfirmed(false); setGuestName("") }}
                    className="text-2xs mt-1.5 transition-colors hover:underline"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {guestName} \u00B7 Changer de nom
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
