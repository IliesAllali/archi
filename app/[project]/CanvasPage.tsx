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
import { Share2, ChevronLeft, Command, Undo2, Redo2, History, Settings, Monitor } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ExportButton from "@/components/ExportButton";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import { usePresence } from "@/hooks/usePresence";
import { usePresenceStore } from "@/hooks/usePresenceStore";

interface Props {
  project: Project;
  currentUser?: { id: string; name: string; role: string } | null;
}

export default function CanvasPage({ project, currentUser }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const handleSpotlightSelect = useCallback(
    (node: SiteNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

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

        {/* Center — meta */}
        <div className="hidden md:flex items-center gap-3 text-2xs absolute left-1/2 -translate-x-1/2">
          <span className="font-mono" style={{ color: "var(--text-muted)" }}>
            {project.client}
          </span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span
            className="font-medium px-1.5 py-0.5 rounded font-mono"
            style={{
              color: project.accent,
              backgroundColor: `${project.accent}18`,
            }}
          >
            {project.version}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{formattedDate}</span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span className="tabular-nums font-mono" style={{ color: "var(--text-muted)" }}>
            {nodes.length}p
          </span>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          <PresenceAvatars users={otherUsers} />
          {otherUsers.length > 0 && <div className="w-px h-4 bg-line mx-1 hidden sm:block" />}
          <SaveStatusBadge />

          <button
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
              window.dispatchEvent(e);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Rechercher une page"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono">K</span>
          </button>

          <button
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "f", metaKey: true, bubbles: true });
              window.dispatchEvent(e);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Ajuster la vue"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono">F</span>
          </button>

          <button
            onClick={() => setHistoryOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Historique des versions"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          <ThemeToggle />
          <ExportButton project={liveProject} />

          <Link
            href={`/${project.id}/settings`}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Param\u00e8tres"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>

          <div className="w-px h-4 bg-line mx-1 hidden sm:block" />

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
        Mode lecture \u2014 \u00e9dition sur desktop uniquement
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          project={liveProject}
          externalSelectedNode={selectedNode}
          onExternalSelectClear={() => selectNode(null)}
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
    </div>
  );
}
