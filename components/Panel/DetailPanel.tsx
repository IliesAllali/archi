"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Home, LayoutGrid, FileText, PenLine, Sparkles, HelpCircle,
  Search, AlertTriangle, Scale, Layers, Tag, MousePointerClick,
  Lightbulb, MessageSquare, Globe, Trash2, Link2, Unlink,
} from "lucide-react";
import type { SiteNode, Project, NodeData, BuiltInPageType } from "@/lib/types";
import { BUILT_IN_PAGE_TYPES, PAGE_TYPE_CONFIG } from "@/lib/types";
import { useCanvasStore } from "@/store/canvas-store";
import ZoningEditor from "./ZoningEditor";
import EntryPointsBlock from "./EntryPointsBlock";

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home, listing: LayoutGrid, detail: FileText, form: PenLine,
  landing: Sparkles, quiz: HelpCircle, search: Search, hub: Layers,
  error: AlertTriangle, legal: Scale,
};

const COLOR_PALETTE: { value: string; color: string; label: string }[] = [
  { value: "",       color: "var(--accent)",  label: "Défaut" },
  { value: "blue",   color: "#5B8AF0",        label: "Bleu" },
  { value: "green",  color: "#2DB8A0",        label: "Vert" },
  { value: "orange", color: "#E8922A",        label: "Orange" },
  { value: "purple", color: "#A87FD4",        label: "Violet" },
  { value: "red",    color: "#E5534B",        label: "Rouge" },
  { value: "pink",   color: "#D946A8",        label: "Rose" },
  { value: "yellow", color: "#CA8A04",        label: "Jaune" },
  { value: "gray",   color: "#6B7280",        label: "Gris" },
];

// Backwards compat: map old SERCE-specific keys to new generic ones
const LEGACY_GROUP_MAP: Record<string, string> = {
  metiers: "blue", formations: "green", orientation: "orange", ressources: "purple",
  rouge: "red", rose: "pink", jaune: "yellow", gris: "gray",
};

const GROUP_COLORS: Record<string, string> = Object.fromEntries(
  COLOR_PALETTE.filter((c) => c.value).map((c) => [c.value, c.color])
);

function resolveGroup(group?: string): string {
  if (!group) return "";
  return LEGACY_GROUP_MAP[group] || group;
}

function getNodeColor(group?: string): string {
  const g = resolveGroup(group);
  if (g && GROUP_COLORS[g]) return GROUP_COLORS[g];
  return "var(--accent)";
}

function getNodeColorTint(group?: string): string {
  const g = resolveGroup(group);
  if (g && GROUP_COLORS[g]) return `${GROUP_COLORS[g]}18`;
  return "var(--accent-muted)";
}

function ColorDot({ group, onChange }: { group?: string; onChange: (g: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = getNodeColor(group);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center group cursor-pointer"
        title="Couleur"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
          style={{ background: color, boxShadow: `0 0 0 2px ${color}30` }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 p-1.5 rounded-lg border border-line bg-bg-surface shadow-lg"
          style={{ minWidth: 140 }}
        >
          <div className="grid grid-cols-5 gap-1 mb-1.5">
            {COLOR_PALETTE.map((c) => {
              const isActive = resolveGroup(group) === c.value;
              const resolvedColor = c.value ? c.color : "var(--accent)";
              return (
                <button
                  key={c.value || "__default"}
                  onClick={() => { onChange(c.value); setOpen(false); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-transform duration-150 ease-out hover:scale-110"
                  style={{
                    background: `${resolvedColor}18`,
                    border: isActive ? `2px solid ${resolvedColor}` : "2px solid transparent",
                  }}
                  title={c.label}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: resolvedColor }}
                  />
                </button>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
              {COLOR_PALETTE.find((c) => c.value === (group || ""))?.label || "Défaut"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const TYPE_OPTIONS = BUILT_IN_PAGE_TYPES.filter((t) => t !== "home");

function TypePicker({ type, onChange }: { type: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = PAGE_TYPE_CONFIG[type as BuiltInPageType];
  const label = config?.label || type;
  const TypeIcon = ICON_MAP[type] || FileText;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 group cursor-pointer"
      >
        <span className="text-2xs transition-colors group-hover:opacity-70" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 py-1 rounded-lg border border-line bg-bg-surface shadow-lg"
          style={{ minWidth: 150 }}
        >
          {TYPE_OPTIONS.map((t) => {
            const c = PAGE_TYPE_CONFIG[t];
            const TIcon = ICON_MAP[t] || FileText;
            const isActive = type === t;
            return (
              <button
                key={t}
                onClick={() => { onChange(t); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors"
                style={{
                  background: isActive ? "var(--accent-muted)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <TIcon className="w-3 h-3 shrink-0" style={{ opacity: 0.7 }} />
                <span className="text-2xs">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DetailPanelProps {
  node: SiteNode | null;
  project: Project;
  onClose: () => void;
  readOnly?: boolean;
}

function getNodePath(node: SiteNode, allNodes: SiteNode[]): SiteNode[] {
  const parentMap = new Map<string, string>();
  for (const n of allNodes) {
    for (const childId of n.children) {
      if (!parentMap.has(childId)) parentMap.set(childId, n.id);
    }
  }
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const path: SiteNode[] = [];
  let cur: string | undefined = node.id;
  const visited = new Set<string>();
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const n = nodeMap.get(cur);
    if (n) path.unshift(n);
    cur = parentMap.get(cur);
  }
  return path;
}

export default function DetailPanel({ node, project, onClose, readOnly = false }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const nodes = useCanvasStore((s) => s.nodes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (node && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    setShowDeleteConfirm(false);
  }, [node?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setDragX(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.touches[0].clientX - touchStartX;
    if (diff > 0) setDragX(diff);
  };
  const handleTouchEnd = () => {
    if (dragX > 100) onClose();
    setTouchStartX(null);
    setDragX(0);
  };

  const handleFieldChange = useCallback(
    (field: keyof NodeData, value: unknown) => {
      if (!node) return;
      updateNodeData(node.id, { [field]: value } as Partial<NodeData>);
    },
    [node, updateNodeData]
  );

  const Icon = node ? (ICON_MAP[node.type] || FileText) : FileText;
  const nodePath = node ? getNodePath(node, nodes.length > 0 ? nodes : project.nodes) : [];
  const nodeColor = node ? getNodeColor(node.group) : "var(--accent)";
  const nodeColorTint = node ? getNodeColorTint(node.group) : "var(--accent-muted)";

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 sm:pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--canvas-bg), transparent 60%)", opacity: 0.5 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: dragX, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={dragX > 0 ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 350 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="absolute top-0 right-0 h-full w-full sm:w-[380px] z-50 flex flex-col glass"
            style={{
              background: "var(--elevated)",
              borderLeft: "1px solid var(--line)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 pt-5 pb-4 shrink-0"
              style={{ borderBottom: `2px solid ${nodeColor}`, borderTop: `3px solid ${nodeColor}` }}
            >
              {nodePath.length > 1 && (
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {nodePath.slice(0, -1).map((ancestor) => (
                    <span key={ancestor.id} className="flex items-center gap-1">
                      <span className="text-2xs" style={{ color: "var(--text-faint)" }}>{ancestor.label}</span>
                      <span className="text-2xs" style={{ color: "var(--text-faint)" }}>&rsaquo;</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", damping: 15 }}
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: nodeColorTint }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: nodeColor }} />
                  </motion.div>
                  <div className="min-w-0">
                    {readOnly ? (
                      <p className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {node.label}
                      </p>
                    ) : (
                      <EditableText
                        value={node.label}
                        onChange={(v) => handleFieldChange("label", v)}
                        className="text-base font-semibold text-label-primary"
                        placeholder="Nom de la page"
                      />
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {readOnly ? (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: nodeColor }}
                        />
                      ) : (
                        <ColorDot
                          group={node.group}
                          onChange={(g) => handleFieldChange("group", g || undefined)}
                        />
                      )}
                      {readOnly || node.type === "home" ? (
                        <span className="text-2xs" style={{ color: "var(--text-muted)" }}>
                          {PAGE_TYPE_CONFIG[node.type as BuiltInPageType]?.label || node.type}
                        </span>
                      ) : (
                        <TypePicker
                          type={node.type}
                          onChange={(t) => handleFieldChange("type", t)}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-bg-hover active:bg-bg-active transition-[background-color,transform] duration-150 ease-out hover:rotate-90 active:scale-[0.93]"
                  >
                    <X className="w-4 h-4 text-label-muted" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scroll">
              <SectionAnimated index={0} title="Description">
                {readOnly ? (
                  <ReadOnlyText value={node.description} placeholder="Aucune description" />
                ) : (
                  <EditableTextarea
                    value={node.description || ""}
                    onChange={(v) => handleFieldChange("description", v)}
                    placeholder="Description de la page..."
                    minRows={5}
                    maxRows={200}
                  />
                )}
              </SectionAnimated>

              {!readOnly && (
                <SectionAnimated index={1} title="Points d'entrée" icon={Globe}>
                  <EntryPointsBlock
                    entryPoints={node.entryPoints || []}
                    onChange={(eps) => handleFieldChange("entryPoints", eps)}
                  />
                </SectionAnimated>
              )}

              {!readOnly && (
                <SectionAnimated index={2} title="Zoning" icon={Layers}>
                  <ZoningEditor
                    pageType={node.type}
                    pageLabel={node.label}
                    blocks={node.zoningBlocks || []}
                    expanded={node.zoningExpanded ?? false}
                    html={node.zoningHtml}
                    accent={project.accent}
                    projectName={project.name}
                    description={node.description || ""}
                    annotations={node.annotations || []}
                    canvasMode={node.zoningCanvasMode}
                    onChange={handleFieldChange}
                  />
                </SectionAnimated>
              )}

              <SectionAnimated index={3} title="Rationale" icon={Lightbulb}>
                {readOnly ? (
                  <ReadOnlyText value={node.rationale} placeholder="Non renseigné" />
                ) : (
                  <EditableTextarea
                    value={node.rationale || ""}
                    onChange={(v) => handleFieldChange("rationale", v)}
                    placeholder="Pourquoi cette page existe..."
                    minRows={2}
                    maxRows={6}
                  />
                )}
              </SectionAnimated>

              {!readOnly && (
                <SectionAnimated index={4} title="Notes" icon={MessageSquare}>
                  <EditableTextarea
                    value={node.notes || ""}
                    onChange={(v) => handleFieldChange("notes", v)}
                    placeholder="Notes internes, insights UX..."
                    minRows={2}
                    maxRows={6}
                  />
                </SectionAnimated>
              )}

              <SectionAnimated index={5} title="CTAs" icon={MousePointerClick}>
                {readOnly ? (
                  <ReadOnlyTags values={node.cta || []} accentStyle />
                ) : (
                  <EditableTagList
                    values={node.cta || []}
                    onChange={(v) => handleFieldChange("cta", v)}
                    placeholder="Ajouter un CTA..."
                    accentStyle
                  />
                )}
              </SectionAnimated>

              <SectionAnimated index={6} title="Tags" icon={Tag}>
                {readOnly ? (
                  <ReadOnlyTags values={node.tags || []} />
                ) : (
                  <EditableTagList
                    values={node.tags || []}
                    onChange={(v) => handleFieldChange("tags", v)}
                    placeholder="Ajouter un tag..."
                  />
                )}
              </SectionAnimated>

              {/* Secondary parents (multi-parent links) */}
              {node.secondaryParentIds && node.secondaryParentIds.length > 0 && (
                <SectionAnimated index={7} title="Parents secondaires" icon={Link2}>
                  <div className="flex flex-col gap-1.5">
                    {node.secondaryParentIds.map((pid) => {
                      const parentNode = nodes.find((n) => n.id === pid);
                      if (!parentNode) return null;
                      return (
                        <div
                          key={pid}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md"
                          style={{ background: "var(--bg-hover)" }}
                        >
                          <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {parentNode.label}
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() => {
                                const unlinkFromParent = useCanvasStore.getState().unlinkFromParent;
                                unlinkFromParent(node.id, pid);
                              }}
                              className="p-1 rounded hover:bg-bg-hover transition-colors shrink-0"
                              title="Supprimer ce lien"
                            >
                              <Unlink className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SectionAnimated>
              )}

              {/* Cross-links (dashed, non-hierarchical) */}
              {node.links && node.links.length > 0 && (
                <SectionAnimated index={8} title="Liens" icon={Link2}>
                  <div className="flex flex-col gap-1.5">
                    {node.links.map((tid) => {
                      const targetNode = nodes.find((n) => n.id === tid);
                      if (!targetNode) return null;
                      return (
                        <div
                          key={tid}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md"
                          style={{ background: "var(--bg-hover)" }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span style={{ color: "var(--text-faint)", fontSize: 10 }}>...</span>
                            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                              {targetNode.label}
                            </span>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => {
                                const removeCrossLink = useCanvasStore.getState().removeCrossLink;
                                removeCrossLink(node.id, tid);
                              }}
                              className="p-1 rounded hover:bg-bg-hover transition-colors shrink-0"
                              title="Supprimer ce lien"
                            >
                              <Unlink className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SectionAnimated>
              )}

              {/* Delete zone */}
              {!readOnly && node.type !== "home" && (
                <div className="px-5 py-4">
                  {showDeleteConfirm ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg border" style={{ borderColor: "var(--error-border)", background: "var(--error-glow)" }}>
                      <p className="text-xs font-medium" style={{ color: "var(--error-text)" }}>
                        Supprimer « {node.label} » {node.children.length > 0 ? `et ses ${node.children.length} sous-page${node.children.length > 1 ? "s" : ""} ?` : "?"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            deleteNode(node.id, "cascade");
                            setShowDeleteConfirm(false);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded text-xs font-medium text-white transition-colors"
                          style={{ background: "var(--error-text)" }}
                        >
                          {node.children.length > 0 ? "Supprimer tout" : "Supprimer"}
                        </button>
                        {node.children.length > 0 && (
                          <button
                            onClick={() => {
                              deleteNode(node.id, "reparent");
                              setShowDeleteConfirm(false);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded text-xs font-medium transition-colors border"
                            style={{ color: "var(--text-secondary)", borderColor: "var(--line)" }}
                          >
                            Remonter les enfants
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="ml-auto p-1 rounded hover:bg-bg-hover transition-colors"
                        >
                          <X className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed transition-all duration-150 hover:border-red-400/40 hover:bg-red-500/5 group"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-label-faint group-hover:text-red-500 transition-colors group-hover:animate-[wiggle_400ms_ease-out]" />
                      <span className="text-xs text-label-faint group-hover:text-red-500 transition-colors">
                        Supprimer cette page
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="h-8" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Animated section wrapper ─── */

function SectionAnimated({
  title, icon: SectionIcon, children, index,
}: {
  title: string; icon?: React.ElementType; children: React.ReactNode; index: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.03, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="px-5"
      style={{ borderBottom: "1px solid var(--line-subtle)" }}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-1.5 w-full py-4 select-none rounded-md transition-all duration-150 active:scale-[0.98]"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover, rgba(0,0,0,0.03))"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        style={{ marginLeft: "-4px", marginRight: "-4px", paddingLeft: "4px", paddingRight: "4px" }}
      >
        {SectionIcon && <SectionIcon className="w-3 h-3 text-label-faint" />}
        <h3 className="text-2xs font-medium text-label-muted uppercase tracking-wider flex-1 text-left">{title}</h3>
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="text-label-faint text-xs"
        >
          &#9662;
        </motion.span>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: collapsed ? "0px" : "1000px",
          opacity: collapsed ? 0 : 1,
          paddingBottom: collapsed ? "0px" : "16px",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Editable inline text ─── */

function EditableText({
  value, onChange, className, placeholder,
}: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className={`${className} bg-transparent border-none outline-none w-full`}
        placeholder={placeholder}
        style={{ color: "var(--text-primary)" }}
      />
    );
  }

  return (
    <p
      className={`${className} cursor-text truncate hover:opacity-80 transition-opacity`}
      onClick={() => setEditing(true)}
      style={{ color: value ? "var(--text-primary)" : "var(--text-faint)" }}
    >
      {value || placeholder}
    </p>
  );
}

/* ─── Editable textarea ─── */

function EditableTextarea({
  value, onChange, placeholder, minRows = 2, maxRows = 8,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number; maxRows?: number;
}) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const min = lineHeight * minRows;
    const max = lineHeight * maxRows;
    ta.style.height = `${Math.max(min, Math.min(ta.scrollHeight, max))}px`;
  }, [minRows, maxRows]);

  useEffect(() => { autoResize(); }, [draft, autoResize]);

  const commit = () => {
    if (draft !== value) onChange(draft);
  };

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={(e) => { setDraft(e.target.value); }}
      onBlur={commit}
      placeholder={placeholder}
      className="w-full text-sm leading-relaxed bg-transparent border-none outline-none resize-none overflow-y-auto"
      style={{
        color: "var(--text-secondary)",
        caretColor: "var(--accent)",
        maxHeight: maxRows * 20 + "px",
      }}
    />
  );
}

/* ─── Read-only display helpers ─── */

function ReadOnlyText({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <p
      className="text-sm leading-relaxed whitespace-pre-wrap"
      style={{ color: value ? "var(--text-secondary)" : "var(--text-faint)" }}
    >
      {value || placeholder}
    </p>
  );
}

function ReadOnlyTags({ values, accentStyle }: { values: string[]; accentStyle?: boolean }) {
  if (!values.length) return <p className="text-sm" style={{ color: "var(--text-faint)" }}>Aucun</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((tag, i) => (
        <div
          key={`${tag}-${i}`}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
            accentStyle ? "bg-accent-muted border border-accent/10" : "bg-bg-hover border border-line"
          }`}
        >
          {accentStyle && <MousePointerClick className="w-3 h-3 text-accent shrink-0" />}
          <span className={accentStyle ? "text-accent" : "text-2xs font-mono text-label-muted"}>
            {tag}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Editable tag list (CTAs / Tags) ─── */

function EditableTagList({
  values, onChange, placeholder, accentStyle,
}: {
  values: string[]; onChange: (v: string[]) => void; placeholder?: string; accentStyle?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((tag, i) => (
          <div
            key={`${tag}-${i}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-default group ${
              accentStyle ? "bg-accent-muted border border-accent/10" : "bg-bg-hover border border-line"
            }`}
          >
            {accentStyle && <MousePointerClick className="w-3 h-3 text-accent shrink-0" />}
            <span className={accentStyle ? "text-accent" : "text-2xs font-mono text-label-muted"}>
              {tag}
            </span>
            <button
              onClick={() => removeTag(i)}
              className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-faint)" }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
          }}
          onBlur={addTag}
          placeholder={placeholder}
          className="flex-1 text-2xs bg-transparent border-none outline-none"
          style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}
