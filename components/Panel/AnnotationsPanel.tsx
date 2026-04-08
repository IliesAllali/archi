"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  Plus, X, MessageSquare, ChevronDown, ChevronRight, Trash2,
  Pencil, Check, Filter,
} from "lucide-react"
import type { WireframeAnnotation, AnnotationTag, NodeData } from "@/lib/types"
import { ANNOTATION_TAG_CONFIG } from "@/lib/types"

interface AnnotationsPanelProps {
  annotations: WireframeAnnotation[]
  onChange: (field: keyof NodeData, value: unknown) => void
  readOnly?: boolean
  /** Sections detected from the wireframe HTML (<!-- Section --> comments) */
  detectedSections?: string[]
  /** Highlight a specific section (from hovering wireframe) */
  highlightedSection?: string | null
  onHoverAnnotation?: (section: string | null) => void
  /** Scroll to a section in the wireframe iframe */
  onScrollToSection?: (section: string) => void
}

const TAG_OPTIONS = Object.entries(ANNOTATION_TAG_CONFIG) as [AnnotationTag, { label: string; color: string }][]
const ALL_TAGS = TAG_OPTIONS.map(([key]) => key)

/* ─── Tag badge ─── */

function TagBadge({ tag, size = "sm" }: { tag: AnnotationTag; size?: "sm" | "xs" }) {
  const config = ANNOTATION_TAG_CONFIG[tag]
  return (
    <span
      className={`inline-flex items-center rounded font-semibold uppercase tracking-wider ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-1 py-px text-[9px]"
      }`}
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
  usedSections,
}: {
  value: string
  onChange: (v: string) => void
  detectedSections: string[]
  usedSections: string[]
}) {
  const [isCustom, setIsCustom] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // If there are detected sections, show a dropdown + custom option
  if (detectedSections.length > 0 && !isCustom) {
    return (
      <div className="flex gap-1.5 items-center">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setIsCustom(true)
              onChange("")
              setTimeout(() => inputRef.current?.focus(), 50)
            } else {
              onChange(e.target.value)
            }
          }}
          className="flex-1 text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none appearance-none"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">Section...</option>
          {detectedSections.map((s) => (
            <option key={s} value={s}>
              {s} {usedSections.includes(s) ? "\u2022" : ""}
            </option>
          ))}
          <option value="__custom__">+ Autre...</option>
        </select>
      </div>
    )
  }

  // Free text fallback (or custom mode)
  return (
    <div className="flex gap-1.5 items-center">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Section (ex: Hero, Navigation)"
        className="flex-1 text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none"
        style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
        autoFocus
      />
      {detectedSections.length > 0 && (
        <button
          onClick={() => { setIsCustom(false); onChange("") }}
          className="text-[10px] px-1.5 py-1 rounded transition-colors hover:bg-bg-hover shrink-0"
          style={{ color: "var(--text-faint)" }}
          title="Choisir dans la liste"
        >
          Liste
        </button>
      )}
    </div>
  )
}

/* ─── Inline-editable annotation card ─── */

function AnnotationCard({
  annotation,
  isHighlighted,
  readOnly,
  detectedSections,
  usedSections,
  onUpdate,
  onRemove,
  onHover,
  onScrollTo,
}: {
  annotation: WireframeAnnotation
  isHighlighted: boolean
  readOnly: boolean
  detectedSections: string[]
  usedSections: string[]
  onUpdate: (patch: Partial<WireframeAnnotation>) => void
  onRemove: () => void
  onHover: (section: string | null) => void
  onScrollTo?: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(annotation.title)
  const [editBody, setEditBody] = useState(annotation.body)
  const [editTag, setEditTag] = useState(annotation.tag)
  const [editSection, setEditSection] = useState(annotation.section)
  const titleRef = useRef<HTMLInputElement>(null)

  const tagColor = ANNOTATION_TAG_CONFIG[annotation.tag].color

  const startEdit = () => {
    setEditTitle(annotation.title)
    setEditBody(annotation.body)
    setEditTag(annotation.tag)
    setEditSection(annotation.section)
    setEditing(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const saveEdit = () => {
    if (!editTitle.trim()) return
    onUpdate({
      title: editTitle.trim(),
      body: editBody.trim(),
      tag: editTag,
      section: editSection || annotation.section,
    })
    setEditing(false)
  }

  const cancelEdit = () => setEditing(false)

  return (
    <div
      className="rounded-lg border transition-all duration-200 group"
      style={{
        borderColor: isHighlighted ? tagColor : "var(--line)",
        background: isHighlighted ? `${tagColor}08` : "var(--bg-surface)",
        boxShadow: isHighlighted ? `0 0 0 1px ${tagColor}30` : "none",
      }}
      onMouseEnter={() => onHover(annotation.section)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-0.5"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
          ) : (
            <ChevronRight className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
          )}
        </button>

        <TagBadge tag={annotation.tag} />

        {editing ? (
          <input
            ref={titleRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
            className="flex-1 text-xs font-medium bg-transparent border-b outline-none"
            style={{ color: "var(--text-primary)", borderColor: "var(--accent)", caretColor: "var(--accent)" }}
          />
        ) : (
          <button
            onClick={() => onScrollTo?.()}
            className="flex-1 text-xs font-medium truncate text-left hover:underline"
            style={{ color: "var(--text-primary)", textDecorationColor: `${tagColor}60` }}
            title={`Aller \u00e0 ${annotation.section}`}
          >
            {annotation.title}
          </button>
        )}

        <span
          className="text-[10px] shrink-0 px-1.5 py-0.5 rounded"
          style={{ color: "var(--text-faint)", background: "var(--bg-hover)" }}
        >
          {annotation.section}
        </span>

        {/* Actions (visible on hover) */}
        {!readOnly && !editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={startEdit}
              className="p-1 rounded transition-colors hover:bg-bg-hover"
              style={{ color: "var(--text-faint)" }}
              title="Modifier"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={onRemove}
              className="p-1 rounded transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-faint)" }}
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {editing && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={saveEdit}
              className="p-1 rounded transition-colors hover:bg-accent-muted"
              style={{ color: "var(--accent)" }}
              title="Sauvegarder"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 rounded transition-colors hover:bg-bg-hover"
              style={{ color: "var(--text-faint)" }}
              title="Annuler"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <SectionSelect
                  value={editSection}
                  onChange={setEditSection}
                  detectedSections={detectedSections}
                  usedSections={usedSections}
                />
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value as AnnotationTag)}
                  className="text-xs px-2 py-1.5 rounded border border-line bg-transparent outline-none shrink-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  {TAG_OPTIONS.map(([key, conf]) => (
                    <option key={key} value={key}>{conf.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none resize-none leading-relaxed"
                style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
                placeholder="D\u00e9tails..."
                onKeyDown={(e) => { if (e.key === "Escape") cancelEdit() }}
              />
            </div>
          ) : (
            annotation.body && (
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                {annotation.body}
              </p>
            )
          )}
        </div>
      )}
    </div>
  )
}

/* ─── New annotation form ─── */

function NewAnnotationForm({
  onAdd,
  onCancel,
  detectedSections,
  usedSections,
}: {
  onAdd: (ann: Omit<WireframeAnnotation, "id">) => void
  onCancel: () => void
  detectedSections: string[]
  usedSections: string[]
}) {
  const [section, setSection] = useState("")
  const [tag, setTag] = useState<AnnotationTag>("UX")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const handleSubmit = () => {
    if (!section.trim() || !title.trim()) return
    onAdd({ section: section.trim(), tag, title: title.trim(), body: body.trim() })
  }

  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2.5" style={{ borderColor: "var(--accent)", background: "var(--bg-surface)" }}>
      <div className="flex gap-2">
        <div className="flex-1">
          <SectionSelect
            value={section}
            onChange={setSection}
            detectedSections={detectedSections}
            usedSections={usedSections}
          />
        </div>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value as AnnotationTag)}
          className="text-xs px-2 py-1.5 rounded border border-line bg-transparent outline-none shrink-0"
          style={{ color: "var(--text-primary)" }}
        >
          {TAG_OPTIONS.map(([key, conf]) => (
            <option key={key} value={key}>{conf.label}</option>
          ))}
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre"
        className="text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none"
        style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
        onKeyDown={(e) => { if (e.key === "Enter" && section && title) handleSubmit() }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="D\u00e9tails..."
        rows={3}
        className="text-xs px-2.5 py-1.5 rounded border border-line bg-transparent outline-none resize-none"
        style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-2.5 py-1.5 rounded text-xs transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!section.trim() || !title.trim()}
          className="px-3 py-1.5 rounded text-xs font-medium text-white transition-colors disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}

/* ─── Main panel ─── */

export default function AnnotationsPanel({
  annotations,
  onChange,
  readOnly = false,
  detectedSections = [],
  highlightedSection,
  onHoverAnnotation,
  onScrollToSection,
}: AnnotationsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [filterTag, setFilterTag] = useState<AnnotationTag | null>(null)
  const [filterSection, setFilterSection] = useState<string | null>(null)

  // Sections that already have annotations
  const usedSections = [...new Set(annotations.map((a) => a.section))]

  const handleAdd = useCallback((ann: Omit<WireframeAnnotation, "id">) => {
    const id = `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    onChange("annotations", [...annotations, { ...ann, id }])
    setShowForm(false)
  }, [annotations, onChange])

  const handleRemove = useCallback((id: string) => {
    onChange("annotations", annotations.filter((a) => a.id !== id))
  }, [annotations, onChange])

  const handleUpdate = useCallback((id: string, patch: Partial<WireframeAnnotation>) => {
    onChange("annotations", annotations.map((a) => a.id === id ? { ...a, ...patch } : a))
  }, [annotations, onChange])

  // Filter annotations
  let filtered = annotations
  if (filterTag) filtered = filtered.filter((a) => a.tag === filterTag)
  if (filterSection) filtered = filtered.filter((a) => a.section === filterSection)

  // Group by section
  const grouped = filtered.reduce<Record<string, WireframeAnnotation[]>>((acc, ann) => {
    if (!acc[ann.section]) acc[ann.section] = []
    acc[ann.section].push(ann)
    return acc
  }, {})

  // Order sections: detected first (in order), then others
  const sectionOrder = [...detectedSections]
  const extraSections = Object.keys(grouped).filter((s) => !sectionOrder.includes(s))
  const orderedSections = [...sectionOrder.filter((s) => grouped[s]), ...extraSections]

  // Tag counts for filter
  const tagCounts = annotations.reduce<Record<string, number>>((acc, a) => {
    acc[a.tag] = (acc[a.tag] || 0) + 1
    return acc
  }, {})

  const hasFilters = filterTag || filterSection

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Annotations
          <span className="ml-1 text-[10px]" style={{ color: "var(--text-faint)" }}>
            {filtered.length !== annotations.length
              ? `${filtered.length}/${annotations.length}`
              : `${annotations.length}`}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {/* Filter toggle */}
          {annotations.length > 2 && (
            <button
              onClick={() => { setFilterTag(null); setFilterSection(null) }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] transition-all hover:bg-bg-hover"
              style={{ color: hasFilters ? "var(--accent)" : "var(--text-faint)" }}
              title={hasFilters ? "Retirer les filtres" : "Filtrer"}
            >
              <Filter className="w-3 h-3" />
              {hasFilters && <X className="w-2.5 h-2.5" />}
            </button>
          )}
          {!readOnly && !showForm && (
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

      {/* Tag filters (show when >2 annotations) */}
      {annotations.length > 2 && (
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
          {/* Section filter */}
          {detectedSections.length > 0 && (
            <select
              value={filterSection || ""}
              onChange={(e) => setFilterSection(e.target.value || null)}
              className="text-[10px] px-1.5 py-0.5 rounded border-none bg-transparent outline-none"
              style={{ color: filterSection ? "var(--accent)" : "var(--text-faint)" }}
            >
              <option value="">Toutes sections</option>
              {detectedSections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <NewAnnotationForm
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          detectedSections={detectedSections}
          usedSections={usedSections}
        />
      )}

      {/* Empty state */}
      {annotations.length === 0 && !showForm && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <MessageSquare className="w-6 h-6" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
          <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Aucune annotation.
            {!readOnly && (
              <>
                <br />
                Ajoutez des notes UX, SEO, copy sur chaque section du wireframe.
              </>
            )}
          </p>
          {!readOnly && detectedSections.length > 0 && (
            <p className="text-[10px] text-center" style={{ color: "var(--text-faint)" }}>
              {detectedSections.length} section{detectedSections.length > 1 ? "s" : ""} d\u00e9tect\u00e9e{detectedSections.length > 1 ? "s" : ""} dans le wireframe
            </p>
          )}
        </div>
      )}

      {/* No results after filter */}
      {annotations.length > 0 && filtered.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-6">
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Aucune annotation pour ce filtre.
          </p>
        </div>
      )}

      {/* Annotations grouped by section */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-2">
        {orderedSections.map((section) => (
          <div key={section} className="flex flex-col gap-1.5">
            {/* Section header */}
            <button
              className="flex items-center gap-2 px-1 py-1 text-left rounded transition-colors hover:bg-bg-hover"
              onMouseEnter={() => onHoverAnnotation?.(section)}
              onMouseLeave={() => onHoverAnnotation?.(null)}
              onClick={() => onScrollToSection?.(section)}
              title={`Voir ${section} dans le wireframe`}
            >
              <div
                className="w-1 h-3.5 rounded-full shrink-0"
                style={{ background: ANNOTATION_TAG_CONFIG[grouped[section][0].tag].color }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                {section}
              </span>
              <span className="text-[9px]" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
                {grouped[section].length}
              </span>
            </button>

            {grouped[section].map((ann) => (
              <AnnotationCard
                key={ann.id}
                annotation={ann}
                isHighlighted={highlightedSection === ann.section}
                readOnly={readOnly}
                detectedSections={detectedSections}
                usedSections={usedSections}
                onUpdate={(patch) => handleUpdate(ann.id, patch)}
                onRemove={() => handleRemove(ann.id)}
                onHover={onHoverAnnotation || (() => {})}
                onScrollTo={() => onScrollToSection?.(ann.section)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
