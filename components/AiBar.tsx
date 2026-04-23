"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Check, AlertTriangle, Zap, Gem, MessageSquare, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AiInput, { type AttachedFile } from "./AiInput";
import { AiActionPill, AiThinkingBlock, compactMarkdownComponents, type AiActionType } from "./ai";
import { useT } from "@/lib/app-i18n";

/* ── Inline response card ─────────────────────────────────────────────────── */

interface InlineResponse {
  id: string;
  type: "edit" | "chat";
  summary: string;
  actions?: { type: string; label?: string }[];
  timestamp: number;
}

function InlineResponseCard({ response, onDismiss }: { response: InlineResponse; onDismiss: () => void }) {
  const t = useT();
  const [expanded, setExpanded] = useState(true);
  const hasActions = response.actions && response.actions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`mx-3 sm:mx-4 mb-2 rounded-lg overflow-hidden ${response.type === "edit" ? "ai-success-glow" : ""}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-float)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{ borderBottom: expanded ? "1px solid var(--line)" : "none" }}
      >
        <div className="flex items-center gap-2">
          {response.type === "edit" ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>
              <Check className="w-3 h-3" />
              {response.actions === undefined
                ? "Modifié"
                : (response.actions.length > 1
                    ? t("aiBar.modifCount_other").replace("{{count}}", String(response.actions.length))
                    : t("aiBar.modifCount_one").replace("{{count}}", String(response.actions.length)))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
              <MessageSquare className="w-3 h-3" />
              {t("aiBar.responseLabel")}
            </div>
          )}
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {new Date(response.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
          </motion.div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="p-0.5 rounded transition-colors hover:bg-black/5"
            style={{ color: "var(--text-faint)" }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {/* Action pills */}
            {hasActions && (
              <div className="flex flex-wrap gap-1 px-3 pt-2.5">
                {response.actions!.slice(0, 10).map((a, i) => (
                  <AiActionPill key={i} type={a.type as AiActionType} label={a.label} index={i} />
                ))}
                {response.actions!.length > 10 && (
                  <span className="text-[10px] px-1.5 py-0.5" style={{ color: "var(--text-faint)" }}>
                    +{response.actions!.length - 10}
                  </span>
                )}
              </div>
            )}

            {/* Summary text */}
            {response.summary && (
              <div className="px-3 py-2.5 ai-response-md">
                <ReactMarkdown
                  components={compactMarkdownComponents}
                >
                  {response.summary}
                </ReactMarkdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import { useCanvasStore } from "@/store/canvas-store";
import { Events } from "@/lib/posthog";
import {
  getStoredProvider,
  getStoredApiKey,
  isByokEnabled,
  getStoredSpeed,
  storeSpeed,
} from "@/lib/ai-providers";
import type { AiSpeed } from "@/lib/ai-providers";
import type { ChatMessage } from "./AiChatPanel";
import { AiSourcePicker } from "./ai";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

interface WireframeContext {
  pageId: string;
  pageLabel: string;
  pageType: string;
  description: string;
  blocks: { label: string; skin: string; height: number }[];
  currentHtml: string | undefined;
  hasGlobalHeader: boolean;
  hasGlobalFooter: boolean;
  /** Header global component HTML */
  headerHtml?: string;
  /** Footer global component HTML */
  footerHtml?: string;
  /** Callback to save a global component update */
  onSaveGlobalHtml?: (slot: "header" | "footer", viewport: string, html: string) => void;
}

interface Props {
  projectId: string;
  projectName: string;
  chatMessages: ChatMessage[];
  onChatMessage: (userMsg: ChatMessage, aiMsg: ChatMessage) => void;
  onOpenChat: () => void;
  /** When set, AI operates on wireframe instead of sitemap */
  wireframeContext?: WireframeContext | null;
  /** Callback when wireframe HTML is generated/updated. Called progressively during streaming. */
  onWireframeResult?: (html: string, done: boolean) => void;
  /** Where the user currently is in the UI — informs the AI */
  uiContext?: {
    activeTab?: "sitemap" | "wireframe";
    selectedPageId?: string | null;
    wireframePageId?: string | null;
  };
}

export default function AiBar({ projectId, projectName, chatMessages, onChatMessage, onOpenChat, wireframeContext, onWireframeResult, uiContext }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditsEmpty, setCreditsEmpty] = useState(false);
  const [isPaidPlan, setIsPaidPlan] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [actionLog, setActionLog] = useState<{ type: string; label?: string }[]>([]);
  const [lastResponse, setLastResponse] = useState<InlineResponse | null>(null);
  const [speed, setSpeed] = useState<AiSpeed>("fast");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initProject = useCanvasStore((s) => s.initProject);
  // Target for wireframe mode: "page" (default), "header", or "footer"
  type WireframeTarget = "page" | "header" | "footer";
  const [wireframeTarget, setWireframeTarget] = useState<WireframeTarget>("page");
  /** True when toggle was triggered by keyboard — skips animation for instant feel */
  const keyboardToggle = useRef(false);

  // Toggle with Ctrl+I — instant, no animation (used dozens of times/day)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        keyboardToggle.current = true;
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus on open
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (open) {
      setError("");
      setCreditsEmpty(false);
      setLastResponse(null);
      setSpeed(getStoredSpeed());
      if (!wireframeContext) setWireframeTarget("page");
      // Fetch plan for BYOK visibility
      fetch("/api/me/plan").then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.tier) setIsPaidPlan(data.tier !== "free") })
        .catch(() => {})
    }
  }, [open]);

  const handleSubmit = useCallback(async (filesOverride?: AttachedFile[]) => {
    if (!prompt.trim() && !(filesOverride || attachedFiles).length) return;

    const provider = getStoredProvider();
    const byokKey = isByokEnabled() ? getStoredApiKey(provider) : "";
    const apiKey = byokKey || "arbo_credits";

    const currentPrompt = prompt.trim();
    const files = filesOverride || attachedFiles;
    const currentAttachments = files.length > 0
      ? files.map(f => ({ name: f.name, type: f.type, base64: f.base64 }))
      : undefined;
    setAttachedFiles([]);
    setLoading(true);
    setError("");
    setStatusMsg("");
    setActionLog([]);
    setLastResponse(null);

    // ─── Wireframe mode ───
    if (wireframeContext && onWireframeResult) {
      // Fetch wireframe settings for fidelity/font
      let wfFidelity = "lo-fi";
      let wfFont = "Inter";
      try {
        const pRes = await fetch(`/api/projects/${projectId}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.wireframeSettings) {
            wfFidelity = pData.wireframeSettings.fidelity || "lo-fi";
            wfFont = pData.wireframeSettings.font || "Inter";
          }
        }
      } catch { /* use defaults */ }

      // Determine what we're targeting
      const isGlobalTarget = wireframeTarget !== "page" && wireframeContext.onSaveGlobalHtml;
      const globalSlot = wireframeTarget as "header" | "footer";
      const globalDesktopHtml = wireframeTarget === "header" ? wireframeContext.headerHtml
        : wireframeTarget === "footer" ? wireframeContext.footerHtml : undefined;

      if (isGlobalTarget && globalDesktopHtml) {
        // ─── Global component mode ───
        setStatusMsg(`${globalSlot === "header" ? "Header" : "Footer"}...`);
        try {
          const gHeaders: Record<string, string> = { "Content-Type": "application/json" };
          const gCsrf = getCsrfToken();
          if (gCsrf) gHeaders["x-csrf-token"] = gCsrf;
          const res = await fetch("/api/ai/wireframe", {
            method: "POST",
            headers: gHeaders,
            body: JSON.stringify({
              apiKey,
              pageLabel: globalSlot === "header" ? "Header" : "Footer",
              pageType: "component",
              projectName,
              projectId,
              currentHtml: globalDesktopHtml,
              editPrompt: currentPrompt,
              fidelity: wfFidelity,
              font: wfFont,
              attachments: currentAttachments,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            setError(err.error || t("aiBar.errorNetwork"));
            setLoading(false);
            return;
          }

          const reader = res.body?.getReader();
          if (!reader) { setError(t("aiBar.errorNetwork")); setLoading(false); return; }

          const decoder = new TextDecoder();
          let fullHtml = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "chunk") fullHtml += data.text;
                else if (data.type === "error") setError(data.error);
              } catch { /* partial */ }
            }
          }

          if (fullHtml.trim()) {
            let clean = fullHtml.trim();
            const bodyMatch = clean.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) clean = bodyMatch[1].trim();
            const wrapperMatch = clean.match(/<div[^>]*max-width[^>]*>([\s\S]*)<\/div>\s*$/i);
            if (wrapperMatch) clean = wrapperMatch[1].trim();

            wireframeContext.onSaveGlobalHtml!(globalSlot, "desktop", clean);
            setLastResponse({
              id: `wf-${Date.now()}`, type: "edit",
              summary: globalSlot === "header" ? t("aiBar.globalHeaderUpdated") : t("aiBar.globalFooterUpdated"),
              timestamp: Date.now(),
            });
            setPrompt("");
          }
        } catch {
          setError(t("aiBar.errorNetwork"));
        } finally {
          setLoading(false);
          setStatusMsg("");
        }
        return;
      }

      // ─── Page wireframe mode ───
      setStatusMsg(t("aiBar.generating"));
      try {
        const pHeaders: Record<string, string> = { "Content-Type": "application/json" };
        const pCsrf = getCsrfToken();
        if (pCsrf) pHeaders["x-csrf-token"] = pCsrf;
        const res = await fetch("/api/ai/wireframe", {
          method: "POST",
          headers: pHeaders,
          body: JSON.stringify({
            apiKey,
            pageLabel: wireframeContext.pageLabel,
            pageType: wireframeContext.pageType,
            projectName,
            projectId,
            description: wireframeContext.description,
            blocks: wireframeContext.blocks.length > 0
              ? wireframeContext.blocks
              : [],
            hasGlobalHeader: wireframeContext.hasGlobalHeader,
            hasGlobalFooter: wireframeContext.hasGlobalFooter,
            fidelity: wfFidelity,
            font: wfFont,
            ...(wireframeContext.currentHtml ? {
              currentHtml: wireframeContext.currentHtml,
              editPrompt: currentPrompt,
            } : {
              editPrompt: currentPrompt,
            }),
            attachments: currentAttachments,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || t("aiBar.errorNetwork"));
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) { setError(t("aiBar.errorConnection")); setLoading(false); return; }

        const decoder = new TextDecoder();
        let fullHtml = "";
        let lastPush = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                fullHtml += data.text;
                // Push progressive updates every 400ms
                const now = Date.now();
                if (now - lastPush > 400) {
                  lastPush = now;
                  onWireframeResult(fullHtml, false);
                }
              }
              else if (data.type === "error") setError(data.error);
            } catch { /* partial */ }
          }
        }

        if (fullHtml.trim()) {
          onWireframeResult(fullHtml.trim(), true);
          setLastResponse({
            id: `wf-${Date.now()}`, type: "edit",
            summary: wireframeContext.currentHtml ? t("aiBar.wireframeUpdated") : t("aiBar.wireframeGenerated"),
            timestamp: Date.now(),
          });
          setPrompt("");
        }
      } catch {
        setError(t("aiBar.errorNetwork"));
      } finally {
        setLoading(false);
        setStatusMsg("");
      }
      return;
    }

    // ─── Sitemap mode: edit tree ───
    const localActions: { type: string; label?: string }[] = [];
    const history = chatMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const csrf = getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrf) headers["x-csrf-token"] = csrf;

      const res = await fetch("/api/ai/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: currentPrompt,
          apiKey,
          projectId,
          provider: byokKey ? provider : "anthropic",
          speed,
          history,
          attachments: currentAttachments,
          uiContext,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setCreditsEmpty(true);
          Events.premiumWallHit("credits_depleted", "ai_bar");
        } else {
          setError(data.error || t("aiBar.errorNetwork"));
        }
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError(t("aiBar.errorConnection")); setLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "status") {
                setStatusMsg(data.message);
              } else if (currentEvent === "action") {
                const action = { type: data.type, label: data.label };
                localActions.push(action);
                setActionLog((prev) => [...prev, action]);
                setStatusMsg(`${data.index}/${data.index} ${data.type === "add" ? "+" : data.type === "delete" ? "-" : "\u270F"} ${data.label || data.id}`);
              } else if (currentEvent === "done") {
                if (data.type === "chat") {
                  const now = Date.now();
                  const userMsg: ChatMessage = {
                    id: `u-${now}`,
                    role: "user",
                    content: currentPrompt,
                    timestamp: now,
                  };
                  const aiMsg: ChatMessage = {
                    id: `a-${now}`,
                    role: "assistant",
                    content: data.summary || "",
                    timestamp: now + 1,
                  };
                  onChatMessage(userMsg, aiMsg);

                  // Show inline response card
                  setLastResponse({
                    id: aiMsg.id,
                    type: "chat",
                    summary: data.summary || "",
                    timestamp: now,
                  });

                  setPrompt("");
                  setStatusMsg("");
                  Events.aiActionPerformed("chat", "built-in");
                } else {
                  const projectRes = await fetch(`/api/projects/${projectId}`);
                  if (projectRes.ok) {
                    const project = await projectRes.json();
                    initProject(project);
                  }
                  const appliedKey = (data.total ?? 1) > 1 ? "aiBar.appliedFallback_other" : "aiBar.appliedFallback_one"
                  const summary = data.summary || t(appliedKey as Parameters<typeof t>[0]).replace("{{count}}", String(data.total ?? 0));

                  // Send to chat panel (persistent history)
                  const now = Date.now();
                  const userMsg: ChatMessage = {
                    id: `u-${now}`,
                    role: "user",
                    content: currentPrompt,
                    timestamp: now,
                  };
                  const aiMsg: ChatMessage = {
                    id: `a-${now}`,
                    role: "assistant",
                    content: summary,
                    timestamp: now + 1,
                    pendingActions: localActions.map(a => ({
                      action: a.type as "add" | "update" | "delete" | "move",
                      label: a.label,
                    })),
                    applied: true,
                  };
                  onChatMessage(userMsg, aiMsg);

                  // Show inline response card (not the side panel)
                  setLastResponse({
                    id: aiMsg.id,
                    type: "edit",
                    summary,
                    actions: localActions,
                    timestamp: now,
                  });

                  setPrompt("");
                  setStatusMsg("");
                  Events.aiActionPerformed("edit_tree", "built-in");
                }
              } else if (currentEvent === "error") {
                setError(data.error);
              }
            } catch { /* ignore parse errors */ }
            currentEvent = "";
          }
        }
      }
    } catch {
      setError(t("aiBar.errorConnection"));
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }, [prompt, attachedFiles, projectId, projectName, speed, initProject, chatMessages, onChatMessage, onOpenChat, wireframeContext, onWireframeResult, t]);

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 sm:bottom-5 left-0 right-0 mx-auto z-30 w-fit flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] animate-breathe hover:animate-none"
          style={{
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t("aiBar.toggleLabel")}
          <kbd className="ml-1 px-1.5 py-0.5 rounded text-2xs font-mono hidden sm:inline" style={{ background: "rgba(255,255,255,0.2)" }}>
            Ctrl+I
          </kbd>
        </motion.button>
      )}

      {/* AI Bar panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: keyboardToggle.current ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: keyboardToggle.current ? 0 : 20 }}
            transition={{ duration: keyboardToggle.current ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => { keyboardToggle.current = false; }}
            className="fixed bottom-3 sm:bottom-5 left-0 right-0 mx-auto z-30 w-[calc(100%-24px)] sm:w-[560px] max-w-[560px] rounded-xl overflow-hidden"
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--line-strong)",
              boxShadow: "var(--shadow-panel)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {t("aiBar.headerTitle")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Speed toggle */}
                <button
                  onClick={() => { const next = speed === "fast" ? "quality" : "fast"; setSpeed(next); storeSpeed(next); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
                  style={{
                    color: speed === "fast" ? "var(--warning-text)" : "var(--accent)",
                    background: speed === "fast" ? "var(--warning-bg)" : "var(--accent-muted)",
                  }}
                  title={speed === "fast" ? t("aiBar.speedFastTooltip") : t("aiBar.speedQualityTooltip")}
                >
                  {speed === "fast" ? <Zap className="w-3 h-3" /> : <Gem className="w-3 h-3" />}
                  {speed === "fast" ? t("aiBar.speedFast") : t("aiBar.speedQuality")}
                </button>
                {/* Credits badge */}
                <AiSourcePicker />
                {/* Chat history button */}
                {chatMessages.length > 0 && (
                  <button
                    onClick={onOpenChat}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-medium transition-colors duration-150"
                    style={{ color: "var(--text-muted)", background: "var(--surface)" }}
                    title={t("aiBar.openChatTooltip")}
                  >
                    {t("aiBar.chatButton")} ({Math.floor(chatMessages.length / 2) || chatMessages.length})
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: "var(--text-faint)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live status during AI processing */}
            {loading && (
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                <AiThinkingBlock variant="inline" status={statusMsg} />
              </div>
            )}

            {/* Action log during processing */}
            {loading && actionLog.length > 0 && (
              <div className="px-4 py-1.5 flex flex-wrap gap-1" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                {actionLog.map((a, i) => (
                  <AiActionPill key={i} type={a.type as AiActionType} label={a.label} index={i} size="sm" />
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--error-glow)" }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--error-text)" }} />
                <p className="text-2xs" style={{ color: "var(--error-text)" }}>{error}</p>
              </div>
            )}

            {/* Credits empty banner */}
            {creditsEmpty && !error && (
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ background: "var(--warning-bg)", borderBottom: "1px solid var(--line)" }}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--warning-text)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-2xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {t("aiBar.creditsEmptyTitle")}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {isPaidPlan ? t("aiBar.creditsEmptyDesc") : t("aiBar.creditsEmptyDescFree")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/checkout?product=credits_starter")
                        if (!res.ok) throw new Error()
                        const { url } = await res.json()
                        if (url) {
                          const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed")
                          const checkout = await PolarEmbedCheckout.create(url, { theme: "dark" })
                          checkout.addEventListener("success", () => { setCreditsEmpty(false); window.location.reload() })
                        }
                      } catch { /* fallback */ }
                    }}
                    className="px-2 py-1 rounded-md text-[10px] font-medium transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {t("aiBar.rechargeButton")}
                  </button>
                  {isPaidPlan && (
                    <a
                      href="/account"
                      className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors duration-150 hover:bg-[var(--surface-hover)]"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}
                    >
                      {t("aiBar.apiKeyButton")}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Inline response card */}
            <AnimatePresence>
              {lastResponse && !loading && (
                <div className="pt-2">
                  <InlineResponseCard
                    response={lastResponse}
                    onDismiss={() => setLastResponse(null)}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3">
              {/* Target selector — only in wireframe mode when globals exist */}
              {wireframeContext && (wireframeContext.hasGlobalHeader || wireframeContext.hasGlobalFooter) && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] mr-1" style={{ color: "var(--text-faint)" }}>{t("aiBar.targetLabel")}</span>
                  {(["page", ...(wireframeContext.hasGlobalHeader ? ["header"] : []), ...(wireframeContext.hasGlobalFooter ? ["footer"] : [])] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => setWireframeTarget(target as "page" | "header" | "footer")}
                      className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors duration-150"
                      style={{
                        background: wireframeTarget === target ? "var(--accent)" : "var(--bg-hover)",
                        color: wireframeTarget === target ? "#fff" : "var(--text-faint)",
                      }}
                    >
                      {target === "page" ? t("aiBar.targetPage") : target === "header" ? t("aiBar.targetHeader") : t("aiBar.targetFooter")}
                    </button>
                  ))}
                </div>
              )}
              <AiInput
                value={prompt}
                onChange={setPrompt}
                onSend={(_text, files) => handleSubmit(files)}
                placeholder={wireframeContext
                  ? wireframeTarget === "header" ? t("aiBar.inputPlaceholderHeader")
                  : wireframeTarget === "footer" ? t("aiBar.inputPlaceholderFooter")
                  : `Wireframe "${wireframeContext.pageLabel}" — ${t("aiBar.inputPlaceholderWireframe")}`
                  : t("aiBar.inputPlaceholderSitemap")}
                rows={1}
                disabled={loading}
                compact
                sendKey="enter"
                onEscape={() => setOpen(false)}
                textareaRef={inputRef}
                renderSendButton={(send) => (
                  <button
                    onClick={send}
                    disabled={loading || !prompt.trim()}
                    className="self-end p-2 rounded-lg transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 flex items-center justify-center gap-[2px]">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-[3px] h-[3px] rounded-full bg-white"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                )}
              />
              <div className="hidden sm:flex items-center justify-between mt-2">
                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  {t("aiBar.sendHint")}
                </p>
                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  {t("aiBar.closeHint")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
