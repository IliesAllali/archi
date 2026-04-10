"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import type { Project, SiteNode } from "@/lib/types";
import { DEFAULT_WIREFRAME_SETTINGS } from "@/lib/types";
import { useCanvasStore, setupAutoSave } from "@/store/canvas-store";
import Canvas from "@/components/Tree/Canvas";
import Logo from "@/components/Logo";
import Spotlight from "@/components/Spotlight";
import ShareModal from "@/components/ShareModal";
import SaveStatusBadge from "@/components/SaveStatusBadge";
import PresenceAvatars from "@/components/PresenceAvatars";
import { Share2, ChevronLeft, Undo2, Redo2, Monitor, MoreHorizontal, Search, Maximize, History, Settings, MessageCircle, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ExportButton from "@/components/ExportButton";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import AiBar from "@/components/AiBar";
import AiChatPanel from "@/components/AiChatPanel";
import type { ChatMessage, AiAction } from "@/components/AiChatPanel";
import CommentsPanel from "@/components/CommentsPanel";
import WireframeView from "@/components/Wireframe/WireframeView";
import { Layout, GitBranch } from "lucide-react";
import { useCommentsStore } from "@/store/comments-store";
import { usePresence } from "@/hooks/usePresence";
import { usePresenceStore } from "@/hooks/usePresenceStore";

interface Props {
  project: Project;
  currentUser?: { id: string; name: string; role: string; avatar?: string | null } | null;
  readOnly?: boolean;
}

function CommentModeButton({ accent, onToggle, isActive }: { accent: string; onToggle: () => void; isActive: boolean }) {
  const unresolvedCount = useCommentsStore(s => s.comments.filter(c => !c.parentId && !c.resolved).length)

  return (
    <button
      onClick={onToggle}
      className="relative flex items-center gap-1.5 p-1.5 rounded-md text-2xs font-medium transition-all duration-150 active:scale-95"
      style={{
        background: isActive ? `${accent}20` : "transparent",
        color: isActive ? accent : "var(--text-muted)",
      }}
      title={isActive ? "Masquer les commentaires" : "Commentaires"}
    >
      <MessageCircle className="w-4 h-4" />
      {unresolvedCount > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-white"
          style={{ background: accent, fontSize: 9, fontWeight: 700 }}
        >
          {unresolvedCount > 9 ? "9+" : unresolvedCount}
        </span>
      )}
    </button>
  )
}

type ProjectTab = "sitemap" | "wireframe"

export default function CanvasPage({ project, currentUser, readOnly = false }: Props) {
  // Visibility for guests based on shareView setting
  const wfSettings = project.wireframeSettings
    ? { ...DEFAULT_WIREFRAME_SETTINGS, ...project.wireframeSettings }
    : DEFAULT_WIREFRAME_SETTINGS
  const shareView = wfSettings.shareView || (wfSettings.guestVisible ? 'both' : 'sitemap')
  const wireframeHiddenForGuest = readOnly && (shareView === 'sitemap')
  const sitemapHiddenForGuest = readOnly && (shareView === 'wireframe')

  const shareViewInit = project.wireframeSettings?.shareView || (project.wireframeSettings?.guestVisible === false ? 'sitemap' : 'both')
  const [activeTab, setActiveTab] = useState<ProjectTab>(readOnly && shareViewInit === "wireframe" ? "wireframe" : "sitemap");
  const [wireframePageId, setWireframePageId] = useState<string | null>(null);
  const [wireframeStreamHtml, setWireframeStreamHtml] = useState<string | null>(null);
  const [wireframeStreamDone, setWireframeStreamDone] = useState(false);
  const [wireframeGenerating, setWireframeGenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [wireframeCommentsOpen, setWireframeCommentsOpen] = useState(false);

  const [liveGlobalSections, setLiveGlobalSections] = useState(project.globalSections || []);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsNodeId, setCommentsNodeId] = useState<string | null>(null);
  const [commentsNodeLabel, setCommentsNodeLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
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
    avatarUrl: currentUser?.avatar || null,
  });

  const otherUsers = usePresenceStore((s) => s.otherUsers);

  // Initialize store with project data
  useEffect(() => {
    initProject(project);
  }, [project, initProject]);

  // Setup auto-save (only for editors)
  useEffect(() => {
    if (readOnly) return;
    const unsub = setupAutoSave(project.id);
    return unsub;
  }, [project.id, readOnly]);

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
    const node = nodeId ? nodes.find(n => n.id === nodeId) : null;
    setCommentsNodeId(nodeId);
    setCommentsNodeLabel(node?.label || null);
    setCommentsOpen(true);
  }, [nodes]);

  // AI Chat handlers
  const handleAiChatMessage = useCallback((userMsg: ChatMessage, aiMsg: ChatMessage) => {
    setAiChatMessages(prev => [...prev, userMsg, aiMsg]);
  }, []);

  const handleAiChatFromSidebar = useCallback(async (message: string, attachments?: { id: string; name: string; type: string; base64: string; dataUrl: string; size: number }[]) => {
    const now = Date.now();
    const userMsg: ChatMessage = { id: `u-${now}`, role: "user", content: message, timestamp: now };
    setAiChatMessages(prev => [...prev, userMsg]);
    setAiChatLoading(true);

    try {
      const { getStoredApiKey, getStoredProvider, getStoredSpeed } = await import("@/lib/ai-providers");
      const provider = getStoredProvider();
      const apiKey = getStoredApiKey(provider);
      const speed = getStoredSpeed();
      if (!apiKey) { setAiChatLoading(false); return; }

      const csrf = document.cookie.match(/arbo_csrf=([^;]+)/)?.[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrf) headers["x-csrf-token"] = csrf;

      const history = [...aiChatMessages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: message, apiKey, projectId: project.id, provider, speed, history, propose: true,
          attachments: attachments?.map(f => ({ name: f.name, type: f.type, base64: f.base64 })),
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const errData = await res.json().catch(() => ({}));
        const aiMsg: ChatMessage = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `\u26a0\ufe0f ${errData.error || "Erreur de connexion"}`,
          timestamp: Date.now(),
        };
        setAiChatMessages(prev => [...prev, aiMsg]);
        setAiChatLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setAiChatLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        let editActionsCount = 0;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "action") {
                editActionsCount++;
              } else if (currentEvent === "done") {
                const isPropose = data.type === "propose" && data.actions?.length > 0;
                const isEdit = !isPropose && data.type !== "chat" && (data.total > 0 || editActionsCount > 0);

                // Build response message
                let content = data.summary || "";
                if (isEdit && editActionsCount > 0) {
                  content = `✅ **${editActionsCount} modification(s) appliquée(s)**\n\n${content}`;
                }

                const aiMsg: ChatMessage = {
                  id: `a-${Date.now()}`,
                  role: "assistant",
                  content,
                  timestamp: Date.now(),
                  ...(isPropose ? { pendingActions: data.actions as AiAction[] } : {}),
                };
                setAiChatMessages(prev => [...prev, aiMsg]);

                // Reload project after direct edits (non-propose)
                if (isEdit) {
                  const projectRes = await fetch(`/api/projects/${project.id}`);
                  if (projectRes.ok) {
                    const proj = await projectRes.json();
                    useCanvasStore.getState().initProject(proj);
                  }
                }
              } else if (currentEvent === "error") {
                const aiMsg: ChatMessage = {
                  id: `e-${Date.now()}`,
                  role: "assistant",
                  content: `\u26a0\ufe0f ${data.error || "Erreur lors du traitement"}`,
                  timestamp: Date.now(),
                };
                setAiChatMessages(prev => [...prev, aiMsg]);
              }
            } catch { /* ignore */ }
            currentEvent = "";
          }
        }
      }
    } catch { /* ignore */ } finally {
      setAiChatLoading(false);
    }
  }, [aiChatMessages, project.id]);

  const handleApplyActions = useCallback(async (messageId: string) => {
    const msg = aiChatMessages.find(m => m.id === messageId);
    if (!msg?.pendingActions?.length || msg.applied || msg.applying) return;

    // Mark as applying
    setAiChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, applying: true } : m));

    try {
      const { getStoredApiKey, getStoredProvider } = await import("@/lib/ai-providers");
      const provider = getStoredProvider();
      const apiKey = getStoredApiKey(provider);
      const csrf = document.cookie.match(/arbo_csrf=([^;]+)/)?.[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrf) headers["x-csrf-token"] = csrf;

      const res = await fetch("/api/ai/apply", {
        method: "POST",
        headers,
        body: JSON.stringify({ projectId: project.id, actions: msg.pendingActions, provider }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }

      // Mark as applied
      setAiChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, applied: true, applying: false } : m));

      // Reload project
      const projectRes = await fetch(`/api/projects/${project.id}`);
      if (projectRes.ok) {
        const proj = await projectRes.json();
        useCanvasStore.getState().initProject(proj);
      }
    } catch {
      // Revert applying state
      setAiChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, applying: false } : m));
    }
  }, [aiChatMessages, project.id]);

  const nodeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of nodes) map[n.id] = n.label;
    return map;
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

          {/* Project tabs */}
          <div
            className="flex items-center rounded-lg p-0.5 ml-1.5 sm:ml-3"
            style={{ background: "var(--bg-hover)" }}
          >
            {!sitemapHiddenForGuest && (
              <button
                onClick={() => setActiveTab("sitemap")}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: activeTab === "sitemap" ? "var(--elevated)" : "transparent",
                  color: activeTab === "sitemap" ? "var(--accent)" : "var(--text-faint)",
                  boxShadow: activeTab === "sitemap" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <GitBranch className="w-3 h-3" />
                <span className="hidden sm:inline">Sitemap</span>
              </button>
            )}
            {!wireframeHiddenForGuest && (
              <button
                onClick={() => setActiveTab("wireframe")}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: activeTab === "wireframe" ? "var(--elevated)" : "transparent",
                  color: activeTab === "wireframe" ? "var(--accent)" : "var(--text-faint)",
                  boxShadow: activeTab === "wireframe" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {wireframeGenerating && activeTab !== "wireframe" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Layout className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">Wireframe</span>
              </button>
            )}
          </div>

          {/* Undo/Redo (editors only) */}
          {!readOnly && (
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
          )}
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          <PresenceAvatars users={otherUsers} />

          {!isDemo && !readOnly && <SaveStatusBadge />}

          <span className="hidden lg:inline text-2xs tabular-nums font-mono ml-1" style={{ color: "var(--text-faint)" }}>
            {nodes.length}p
          </span>

          {(!readOnly || wfSettings.guestCanExport) && (
            <ExportButton project={liveProject} />
          )}

          {/* Comment mode toggle — switches behavior based on active tab */}
          {(activeTab === "wireframe" || !readOnly) && (
            <CommentModeButton
              accent={project.accent}
              isActive={activeTab === "wireframe" ? wireframeCommentsOpen : useCommentsStore.getState().commentMode}
              onToggle={() => {
                if (activeTab === "wireframe") {
                  setWireframeCommentsOpen(v => !v)
                } else {
                  useCommentsStore.getState().toggleCommentMode()
                }
              }}
            />
          )}

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
                  onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <History className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  Historique
                </button>
                {!readOnly && (
                  <button
                    onClick={() => { openComments(selectedNodeId || null); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <MessageCircle className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                    Commentaires
                  </button>
                )}
                {!readOnly && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>

          <ThemeToggle />

          {!isDemo && !readOnly && (
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

          {/* Read-only badge for guests */}
          {readOnly && (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-2xs font-medium"
              style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
            >
              <Monitor className="w-3 h-3" />
              Lecture seule
            </span>
          )}
        </div>
      </header>

      {/* Mobile read-only banner */}
      {readOnly && (
        <div
          className="flex md:hidden items-center justify-center gap-1.5 px-3 py-1.5 text-2xs font-medium"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--line)",
            color: "var(--text-muted)",
          }}
        >
          <Monitor className="w-3 h-3" />
          Mode lecture, édition sur desktop uniquement
        </div>
      )}

      {/* Content — both tabs always mounted, hidden via CSS to preserve state */}
      <div className="flex-1 relative overflow-hidden" style={{ display: activeTab === "sitemap" && !sitemapHiddenForGuest ? "flex" : "none" }}>
        <Canvas
          project={liveProject}
          externalSelectedNode={selectedNode}
          onExternalSelectClear={() => selectNode(null)}
          readOnly={readOnly}
          currentUser={currentUser ? { id: currentUser.id, name: currentUser.name } : null}
        />
      </div>
      <div className="flex-1 overflow-hidden" style={{ display: activeTab === "wireframe" && !wireframeHiddenForGuest ? "flex" : "none" }}>
        <WireframeView
          project={liveProject}
          readOnly={readOnly}
          currentUser={currentUser}
          commentsOpen={wireframeCommentsOpen}
          onCommentsOpenChange={setWireframeCommentsOpen}
          onSelectedPageChange={setWireframePageId}
          externalHtml={wireframeStreamHtml}
          externalDone={wireframeStreamDone}
          onGeneratingChange={setWireframeGenerating}
          onGlobalSectionsChange={setLiveGlobalSections}
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
        readOnly={readOnly}
      />

      {/* Comments panel */}
      <CommentsPanel
        projectId={project.id}
        nodeId={commentsNodeId}
        nodeLabel={commentsNodeLabel}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        currentUser={currentUser ? { id: currentUser.id, name: currentUser.name } : null}
        nodeLabels={nodeLabels}
      />

      {/* AI Chat Panel */}
      <AiChatPanel
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        messages={aiChatMessages}
        onSend={handleAiChatFromSidebar}
        onClear={() => setAiChatMessages([])}
        loading={aiChatLoading}
        onApplyActions={handleApplyActions}
      />

      {/* AI Bar (editors only) */}
      {!isDemo && !readOnly && (
        <AiBar
          projectId={project.id}
          projectName={project.name}
          chatMessages={aiChatMessages}
          onChatMessage={handleAiChatMessage}
          onOpenChat={() => setAiChatOpen(true)}
          wireframeContext={activeTab === "wireframe" && wireframePageId ? (() => {
            const page = nodes.find(n => n.id === wireframePageId);
            if (!page) return null;
            const gs = liveGlobalSections;
            return {
              pageId: page.id,
              pageLabel: page.label,
              pageType: page.type,
              description: page.description || "",
              blocks: (page.zoningBlocks || []).map(b => ({ label: b.label, skin: b.skin, height: b.height })),
              currentHtml: page.zoningHtml,
              hasGlobalHeader: gs.some(s => s.slot === "header"),
              hasGlobalFooter: gs.some(s => s.slot === "footer"),
              headerHtml: gs.find(s => s.slot === "header")?.html,
              footerHtml: gs.find(s => s.slot === "footer")?.html,
              onSaveGlobalHtml: (slot: "header" | "footer", _vp: string, html: string) => {
                const updated = gs.map(s => s.slot === slot ? { ...s, html } : s);
                const csrf = document.cookie.match(/arbo_csrf=([^;]+)/)?.[1];
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (csrf) headers["x-csrf-token"] = csrf;
                fetch(`/api/projects/${project.id}`, {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({ globalSections: updated }),
                });
              },
            };
          })() : null}
          onWireframeResult={activeTab === "wireframe" && wireframePageId ? (html, done) => {
            setWireframeStreamHtml(html);
            setWireframeStreamDone(done);
            if (done) {
              const updateNodeData = useCanvasStore.getState().updateNodeData;
              updateNodeData(wireframePageId, { zoningHtml: html });
              setTimeout(() => { setWireframeStreamHtml(null); setWireframeStreamDone(false); }, 100);
            }
          } : undefined}
        />
      )}
    </div>
  );
}
