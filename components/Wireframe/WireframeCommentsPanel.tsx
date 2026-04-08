"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  Plus, X, ChevronDown, ChevronRight, Trash2,
  Check, Filter, Send, MessageSquare, CheckCircle,
} from "lucide-react"
import { useCommentsStore, type CanvasComment, type CommentTag } from "@/store/comments-store"
import { ANNOTATION_TAG_CONFIG } from "@/lib/types"
import type { AnnotationTag } from "@/lib/types"

/* ─── Constants ─── */

const GUEST_NAME_KEY = "arbo_guest_name"

const TAG_OPTIONS = Object.entries(ANNOTATION_TAG_CONFIG) as [AnnotationTag, { label: string; color: string }][]

/* ─── Tag badge ─── */

function TagBadge({ tag }: { tag: string }) {
  const config = ANNOTATION_TAG_CONFIG[tag as AnnotationTag]
  if (!config) return null
  return (
    <span
      className="inline-flex items-center rounded font-semibold uppercase tracking-wider px-1.5 py-0.5 text-[10px]"
      style={{ background: `${config.color}18`, color: config.color }}
    >
      {config.label}
    </span>
  )
}

/* ─── Section dropdown ─── */

function SectionSelect({
  value,
  onChange,
  detectedSections,
}: {
  value: string
  onChange: (v: string) => void
  detectedSections: string[]
}) {
  if (detectedSections.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none appearance-none"
        style={{ color: "var(--text-primary)" }}
      >
        <option value="">Section...</option>
        {detectedSections.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    )
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Section (ex: Hero, Navigation)"
      className="flex-1 text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none"
      style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
    />
  )
}

/* ─── Comment card ─── */

function CommentCard({
  comment,
  replies,
  isHighlighted,
  onResolve,
  onDelete,
  onReply,
  onHover,
  onScrollTo,
}: {
  comment: CanvasComment
  replies: CanvasComment[]
  isHighlighted: boolean
  onResolve: (resolved: boolean) => void
  onDelete: () => void
  onReply: (content: string) => void
  onHover: (section: string | null) => void
  onScrollTo?: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [showReply, setShowReply] = useState(false)
  const tagColor = comment.tag ? ANNOTATION_TAG_CONFIG[comment.tag as AnnotationTag]?.color : "var(--text-faint)"

  const handleReply = () => {
    if (!replyContent.trim()) return
    onReply(replyContent.trim())
    setReplyContent("")
    setShowReply(false)
  }

  const timeAgo = useMemo(() => {
    const diff = Date.now() - comment.createdAt
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "maintenant"
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}j`
  }, [comment.createdAt])

  return (
    <div
      className="rounded-lg border transition-all duration-200 group"
      style={{
        borderColor: isHighlighted ? tagColor : "var(--line)",
        background: comment.resolved ? "var(--bg-surface)" : isHighlighted ? `${tagColor}08` : "var(--bg-surface)",
        opacity: comment.resolved ? 0.6 : 1,
      }}
      onMouseEnter={() => comment.section && onHover(comment.section)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-0.5">
          {expanded
            ? <ChevronDown className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
            : <ChevronRight className="w-3 h-3" style={{ color: "var(--text-faint)" }} />}
        </button>

        {comment.tag && <TagBadge tag={comment.tag} />}

        <button
          onClick={() => comment.section && onScrollTo?.()}
          className="flex-1 text-xs font-medium truncate text-left hover:underline"
          style={{ color: "var(--text-primary)", textDecorationColor: `${tagColor}60` }}
          title={comment.section ? `Aller à ${comment.section}` : undefined}
        >
          {comment.content.split("\n")[0].slice(0, 80)}
        </button>

        {comment.section && (
          <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded" style={{ color: "var(--text-faint)", background: "var(--bg-hover)" }}>
            {comment.section}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onResolve(!comment.resolved)}
            className="p-1 rounded transition-colors hover:bg-bg-hover"
            style={{ color: comment.resolved ? "var(--accent)" : "var(--text-faint)" }}
            title={comment.resolved ? "Rouvrir" : "Résoudre"}
          >
            <CheckCircle className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded transition-colors hover:bg-red-500/10"
            style={{ color: "var(--text-faint)" }}
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body + replies */}
      {expanded && (
        <div className="px-3 pb-2.5">
          {/* Author + time */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium" style={{ color: "var(--accent)" }}>
              {comment.authorName}
            </span>
            <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>{timeAgo}</span>
          </div>

          {/* Full content */}
          {comment.content.includes("\n") && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2" style={{ color: "var(--text-secondary)" }}>
              {comment.content}
            </p>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 pl-3" style={{ borderLeft: "2px solid var(--line)" }}>
              {replies.map(r => (
                <div key={r.id} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium" style={{ color: "var(--accent)" }}>{r.authorName}</span>
                  {" "}{r.content}
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          {showReply ? (
            <div className="flex gap-1.5 mt-2">
              <input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Répondre..."
                className="flex-1 text-xs px-2 py-1.5 rounded border border-line bg-transparent outline-none"
                style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); if (e.key === "Escape") setShowReply(false) }}
                autoFocus
              />
              <button onClick={handleReply} className="p-1.5 rounded" style={{ color: "var(--accent)" }}>
                <Send className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowReply(true)}
              className="text-[10px] mt-1.5 px-1.5 py-0.5 rounded hover:bg-bg-hover transition-colors"
              style={{ color: "var(--text-faint)" }}
            >
              Répondre
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── New comment form ─── */

function NewCommentForm({
  onAdd,
  onCancel,
  detectedSections,
  authorName,
  initialSection,
}: {
  onAdd: (data: { content: string; section: string; tag: CommentTag }) => void
  onCancel: () => void
  detectedSections: string[]
  authorName: string
  initialSection?: string | null
}) {
  const [section, setSection] = useState(initialSection || "")
  const [tag, setTag] = useState<CommentTag>("UX")
  const [content, setContent] = useState("")

  // Update section when user clicks a different section in the wireframe
  useEffect(() => {
    if (initialSection) setSection(initialSection)
  }, [initialSection])

  const handleSubmit = () => {
    if (!content.trim()) return
    onAdd({ content: content.trim(), section: section.trim(), tag })
  }

  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2.5" style={{ borderColor: "var(--accent)", background: "var(--bg-surface)" }}>
      <div className="flex gap-2">
        <div className="flex-1">
          <SectionSelect value={section} onChange={setSection} detectedSections={detectedSections} />
        </div>
        <select
          value={tag || ""}
          onChange={(e) => setTag((e.target.value || null) as CommentTag)}
          className="text-xs px-2 py-1.5 rounded border border-line bg-transparent outline-none shrink-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">Pas de tag</option>
          {TAG_OPTIONS.map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Commentaire en tant que ${authorName}...`}
        rows={3}
        className="text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none resize-none leading-relaxed"
        style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="px-2.5 py-1.5 rounded text-xs transition-colors" style={{ color: "var(--text-faint)" }}>
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-3 py-1.5 rounded text-xs font-medium text-white transition-colors disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}

/* ─── Guest name prompt ─── */

function GuestNamePrompt({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_NAME_KEY) || ""
    return ""
  })

  const handleConfirm = () => {
    if (!name.trim()) return
    localStorage.setItem(GUEST_NAME_KEY, name.trim())
    onConfirm(name.trim())
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4">
      <MessageSquare className="w-6 h-6" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
      <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
        Entrez votre nom pour commenter
      </p>
      <div className="flex gap-2 w-full max-w-[200px]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          className="flex-1 text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none"
          style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirm() }}
          autoFocus
        />
        <button
          onClick={handleConfirm}
          disabled={!name.trim()}
          className="px-2.5 py-1.5 rounded text-xs font-medium text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          OK
        </button>
      </div>
    </div>
  )
}

/* ─── Main panel ─── */

interface WireframeCommentsPanelProps {
  projectId: string
  nodeId: string
  currentUser?: { id: string; name: string } | null
  detectedSections?: string[]
  highlightedSection?: string | null
  onHoverSection?: (section: string | null) => void
  onScrollToSection?: (section: string) => void
  /** Auto-open the comment form for this section (set when user clicks a section in the wireframe) */
  autoOpenSection?: string | null
  /** Called after autoOpenSection is consumed */
  onAutoOpenConsumed?: () => void
}

export default function WireframeCommentsPanel({
  projectId,
  nodeId,
  currentUser,
  detectedSections = [],
  highlightedSection,
  onHoverSection,
  onScrollToSection,
  autoOpenSection,
  onAutoOpenConsumed,
}: WireframeCommentsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [filterTag, setFilterTag] = useState<AnnotationTag | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(GUEST_NAME_KEY) || ""
    return ""
  })
  const [guestConfirmed, setGuestConfirmed] = useState(() => !!guestName)

  const storeComments = useCommentsStore(s => s.comments)
  const fetchComments = useCommentsStore(s => s.fetchComments)
  const addComment = useCommentsStore(s => s.addComment)
  const resolveComment = useCommentsStore(s => s.resolveComment)
  const deleteComment = useCommentsStore(s => s.deleteComment)

  // Fetch on mount
  useEffect(() => {
    fetchComments(projectId)
  }, [projectId, fetchComments])

  // Auto-open form when user clicks a section in the wireframe
  const [prefilledSection, setPrefilledSection] = useState<string | null>(null)
  useEffect(() => {
    if (autoOpenSection) {
      setPrefilledSection(autoOpenSection)
      setShowForm(true)
      onAutoOpenConsumed?.()
    }
  }, [autoOpenSection, onAutoOpenConsumed])

  // Filter: this node only, root comments only (no replies)
  const nodeComments = useMemo(() => {
    let filtered = storeComments.filter(c => c.nodeId === nodeId && !c.parentId)
    if (!showResolved) filtered = filtered.filter(c => !c.resolved)
    if (filterTag) filtered = filtered.filter(c => c.tag === filterTag)
    return filtered.sort((a, b) => a.createdAt - b.createdAt)
  }, [storeComments, nodeId, showResolved, filterTag])

  // Replies map
  const repliesMap = useMemo(() => {
    const map: Record<string, CanvasComment[]> = {}
    storeComments.filter(c => c.nodeId === nodeId && c.parentId).forEach(c => {
      if (!map[c.parentId!]) map[c.parentId!] = []
      map[c.parentId!].push(c)
    })
    return map
  }, [storeComments, nodeId])

  const authorName = currentUser?.name || guestName
  const needsName = !currentUser && !guestConfirmed

  // Group by section
  const grouped = useMemo(() => {
    const noSection: CanvasComment[] = []
    const sections: Record<string, CanvasComment[]> = {}
    for (const c of nodeComments) {
      if (c.section) {
        if (!sections[c.section]) sections[c.section] = []
        sections[c.section].push(c)
      } else {
        noSection.push(c)
      }
    }
    // Order: detected sections first, then others, then no-section
    const orderedKeys = [
      ...detectedSections.filter(s => sections[s]),
      ...Object.keys(sections).filter(s => !detectedSections.includes(s)),
    ]
    return { orderedKeys, sections, noSection }
  }, [nodeComments, detectedSections])

  const handleAdd = useCallback((data: { content: string; section: string; tag: CommentTag }) => {
    addComment(projectId, {
      nodeId,
      content: data.content,
      authorName,
      section: data.section || null,
      tag: data.tag,
    })
    setShowForm(false)
  }, [projectId, nodeId, authorName, addComment])

  const handleReply = useCallback((parentId: string, content: string) => {
    addComment(projectId, {
      nodeId,
      content,
      authorName,
      parentId,
    })
  }, [projectId, nodeId, authorName, addComment])

  // Tag counts
  const allNodeComments = storeComments.filter(c => c.nodeId === nodeId && !c.parentId && !c.resolved)
  const tagCounts = allNodeComments.reduce<Record<string, number>>((acc, c) => {
    if (c.tag) acc[c.tag] = (acc[c.tag] || 0) + 1
    return acc
  }, {})
  const totalCount = allNodeComments.length
  const resolvedCount = storeComments.filter(c => c.nodeId === nodeId && !c.parentId && c.resolved).length

  if (needsName) {
    return <GuestNamePrompt onConfirm={(name) => { setGuestName(name); setGuestConfirmed(true) }} />
  }

  const renderComments = (comments: CanvasComment[]) =>
    comments.map(c => (
      <CommentCard
        key={c.id}
        comment={c}
        replies={repliesMap[c.id] || []}
        isHighlighted={!!c.section && highlightedSection === c.section}
        onResolve={(resolved) => resolveComment(projectId, c.id, resolved)}
        onDelete={() => deleteComment(projectId, c.id)}
        onReply={(content) => handleReply(c.id, content)}
        onHover={onHoverSection || (() => {})}
        onScrollTo={c.section ? () => onScrollToSection?.(c.section!) : undefined}
      />
    ))

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Commentaires
          <span className="ml-1 text-[10px]" style={{ color: "var(--text-faint)" }}>
            {totalCount}{resolvedCount > 0 ? ` (+${resolvedCount} résolus)` : ""}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {resolvedCount > 0 && (
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
              style={{ color: showResolved ? "var(--accent)" : "var(--text-faint)" }}
            >
              {showResolved ? "Masquer résolus" : `${resolvedCount} résolu${resolvedCount > 1 ? "s" : ""}`}
            </button>
          )}
          {totalCount > 2 && (
            <button
              onClick={() => setFilterTag(null)}
              className="p-1 rounded transition-colors hover:bg-bg-hover"
              style={{ color: filterTag ? "var(--accent)" : "var(--text-faint)" }}
              title="Filtrer"
            >
              <Filter className="w-3 h-3" />
              {filterTag && <X className="w-2.5 h-2.5" />}
            </button>
          )}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all hover:bg-accent-muted"
              style={{ color: "var(--accent)" }}
            >
              <Plus className="w-3 h-3" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Tag filters */}
      {totalCount > 2 && Object.keys(tagCounts).length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {TAG_OPTIONS.filter(([key]) => tagCounts[key]).map(([key, conf]) => (
            <button
              key={key}
              onClick={() => setFilterTag(filterTag === key ? null : key)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider transition-all"
              style={{
                background: filterTag === key ? `${conf.color}25` : `${conf.color}08`,
                color: conf.color,
                opacity: filterTag && filterTag !== key ? 0.4 : 1,
              }}
            >
              {conf.label}
              <span className="text-[8px] opacity-70">{tagCounts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <NewCommentForm
          onAdd={(data) => { handleAdd(data); setPrefilledSection(null) }}
          onCancel={() => { setShowForm(false); setPrefilledSection(null) }}
          detectedSections={detectedSections}
          authorName={authorName}
          initialSection={prefilledSection}
        />
      )}

      {/* Empty state */}
      {totalCount === 0 && !showForm && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <MessageSquare className="w-6 h-6" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
          <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Aucun commentaire sur cette page.
            <br />
            Ajoutez des notes UX, SEO, copy ou des retours sur chaque section.
          </p>
        </div>
      )}

      {/* Comments grouped by section */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-2">
        {grouped.orderedKeys.map(section => (
          <div key={section} className="flex flex-col gap-1.5">
            <button
              className="flex items-center gap-2 px-1 py-1 text-left rounded transition-colors hover:bg-bg-hover"
              onMouseEnter={() => onHoverSection?.(section)}
              onMouseLeave={() => onHoverSection?.(null)}
              onClick={() => onScrollToSection?.(section)}
            >
              <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                {section}
              </span>
              <span className="text-[9px]" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
                {grouped.sections[section].length}
              </span>
            </button>
            {renderComments(grouped.sections[section])}
          </div>
        ))}

        {/* Comments without section */}
        {grouped.noSection.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {grouped.orderedKeys.length > 0 && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-1" style={{ color: "var(--text-faint)" }}>
                Général
              </span>
            )}
            {renderComments(grouped.noSection)}
          </div>
        )}
      </div>
    </div>
  )
}
