"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import type { Project, SiteNode } from "@/lib/types";
import { useCanvasStore, setupAutoSave } from "@/store/canvas-store";
import Canvas from "@/components/Tree/Canvas";
import Logo from "@/components/Logo";
import Spotlight from "@/components/Spotlight";
import ShareModal from "@/components/ShareModal";
import SaveStatusBadge from "@/components/SaveStatusBadge";
import PresenceAvatars from "@/components/PresenceAvatars";
import { Share2, ChevronLeft, Undo2, Redo2, Monitor, MoreHorizontal, Search, Maximize, History, Settings, Activity, MessageCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ExportButton from "@/components/ExportButton";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import ActivityPanel from "@/components/ActivityPanel";
import AiBar from "@/components/AiBar";
import CommentsPanel from "@/components/CommentsPanel";
import { usePresence } from "@/hooks/usePresence";
import { usePresenceStore } from "@/hooks/usePresenceStore";

interface Props {
  project: Project;
  currentUser?: { id: string; name: string; role: string } | null;
}

export default function CanvasPage({ project, currentUser }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsNodeId, setCommentsNodeId] = useState<string | null>(null);
  const [commentsNodeLabel, setCommentsNodeLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initProject = useCanvasStore((s) => s.initProject);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);

  // Presence — writes directly to zustand store, no local state
  const { focusNode, blurNode } = usePresence({
    projectId: project.id,
    userId: currentUser?.id,
    displayName: currentUser?.name,
    role: currentUser?.role,
  });

  const otherUsers = usePresenceStore((s) => s.otherUsers);

  // Initialize store with project data
  useEffect(() => {
    initProject(project);
  }, [project, initProject]);

  // Setup auto-save
  useEffect(() => {
    const unsub = setupAutoSave(project.id);
    return unsub;
  }, [project.id]);

  // Track node focus for presence
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelectedRef.current) {
      focusNode(selectedNodeId);
    } else if (!selectedNodeId && prevSelectedRef.current) {
      blurNode();
    }
    prevSelectedRef.current = selectedNodeId;
  }, [selectedNodeId, focusNode, blurNode]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSpotlightSelect = useCallback(
    (node: SiteNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const openComments = useCallback((nodeId: string | null) => {
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    setCommentsNodeId(nodeId);
    setCommentsNodeLabel(node?.label || null);
    setCommentsOpen(true);
  }, [nodes]);

  const isDemo = project.slug === "demo-ecommerce";

  // Use nodes from store for the project passed to Canvas
  const liveProject = useMemo<Project>(() => ({
    ...project,
    nodes,
  }), [project, nodes]);

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "var(--canvas-bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-2 sm:px-3 h-11 shrink-0 z-20"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {/* Left — breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Link
            href="/"
            className="p-2 sm:p-1.5 rounded-md hover:bg-bg-hover transition-colors duration-100 text-label-faint hover:text-label-muted active:scale-95 shrink-0"
            data-tooltip="Retour"
          >
            <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </Link>
          <div
            className="w-5 h-5 rounded-md items-center justify-center shrink-0 hidden sm:flex"
            style={{
              background: "var(--card-title-bg)",
              border: "1px solid var(--card-ring)",
            }}
          >
            <Logo size={12} />
          </div>
          <span style={{ color: "var(--text-faint)" }} className="select-none text-xs hidden sm:block">
            /
          </span>
          <span
            className="text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-[280px]"
            style={{ color: "var(--text-primary)" }}
          >
            {project.name}
          </span>
          {isDemo && (
            <span
              className="text-2xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "var(--surface-hover)", color: "var(--text-faint)" }}
            >
              Exemple
            </span>
          )}

          {/* Undo/Redo */}
          <div className="hidden sm:flex items-center gap-0.5 ml-2">
            <button
              onClick={undo}
              disabled={past.length === 0}
              className="p-1.5 rounded-md transition-colors duration-100 active:scale-95 disabled:opacity-30"
              style={{ color: "var(--text-muted)" }}
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 rounded-md transition-colors duration-100 active:scale-95 disabled:opacity-30"
              style={{ color: "var(--text-muted)" }}
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          <PresenceAvatars users={otherUsers} />

          {!isDemo && <SaveStatusBadge />}

          <span className="hidden lg:inline text-2xs tabular-nums font-mono ml-1" style={{ color: "var(--text-faint)" }}>
            {nodes.length}p
          </span>

          <ExportButton project={liveProject} />

          {/* More menu */}
          <div className="relative hidden sm:block" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-md transition-colors duration-100 active:scale-95"
              style={{ color: "var(--text-muted)" }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-lg py-1 shadow-lg z-50"
                style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)" }}
              >
                <button
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                    window.dispatchEvent(e);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Search className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Rechercher
                  <span className="ml-auto text-2xs font-mono" style={{ color: "var(--text-faint)" }}>Ctrl+K</span>
                </button>
                <button
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", { key: "f", metaKey: true, bubbles: true });
                    window.dispatchEvent(e);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Maximize className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Ajuster la vue
                  <span className="ml-auto text-2xs font-mono" style={{ color: "var(--text-faint)" }}>Ctrl+F</span>
                </button>
                <div className="my-1" style={{ borderTop: "1px solid var(--line)" }} />
                <button
                  onClick={() => { setActivityOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Activity className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Activité
                </button>
                <button
                  onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <History className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Historique
                </button>
                <button
                  onClick={() => { openComments(selectedNodeId || nodes[0]?.id || null); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Commentaires
                </button>
                <div className="my-1" style={{ borderTop: "1px solid var(--line)" }} />
                <Link
                  href={`/${project.id}/settings`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Settings className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Paramètres
                </Link>
              </div>
            )}
          </div>

          <ThemeToggle />

          {!isDemo && (
            <button
              onClick={() => setShareOpen(true)}
              className="share-btn flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-md text-xs sm:text-2xs font-medium transition-all duration-150 hover:brightness-125 active:scale-95"
              style={{
                backgroundColor: `${project.accent}20`,
                color: project.accent,
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile read-only banner */}
      <div
        className="flex md:hidden items-center justify-center gap-1.5 px-3 py-1.5 text-2xs font-medium"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          color: "var(--text-muted)",
        }}
      >
        <Monitor className="w-3 h-3" />
        Mode lecture — édition sur desktop uniquement
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          project={liveProject}
          externalSelectedNode={selectedNode}
          onExternalSelectClear={() => selectNode(null)}
          onOpenComments={openComments}
        />
      </div>

      {/* Spotlight */}
      <Spotlight nodes={nodes} onSelect={handleSpotlightSelect} />

      {/* Share modal */}
      <ShareModal project={liveProject} open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Version history */}
      <VersionHistoryPanel
        projectId={project.id}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Activity panel */}
      <ActivityPanel
        projectId={project.id}
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />

      {/* Comments panel */}
      <CommentsPanel
        projectId={project.id}
        nodeId={commentsNodeId}
        nodeLabel={commentsNodeLabel}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        currentUser={currentUser ? { id: currentUser.id, name: currentUser.name } : null}
      />

      {/* AI Bar */}
      {!isDemo && <AiBar projectId={project.id} />}
    </div>
  );
}
