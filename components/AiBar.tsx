"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Check, AlertTriangle, Zap, Gem } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { Events } from "@/lib/posthog";
import {
  getStoredProvider,
  getStoredApiKey,
  getStoredSpeed,
  storeSpeed,
} from "@/lib/ai-providers";
import type { AiSpeed } from "@/lib/ai-providers";
import type { ChatMessage } from "./AiChatPanel";
import AiCreditsBadge from "./AiCreditsBadge";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

interface Props {
  projectId: string;
  chatMessages: ChatMessage[];
  onChatMessage: (userMsg: ChatMessage, aiMsg: ChatMessage) => void;
  onOpenChat: () => void;
}

export default function AiBar({ projectId, chatMessages, onChatMessage, onOpenChat }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [actionLog, setActionLog] = useState<{ type: string; label?: string }[]>([]);
  const [speed, setSpeed] = useState<AiSpeed>("fast");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initProject = useCanvasStore((s) => s.initProject);

  // Toggle with Ctrl+I
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
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
      setSuccess("");
      setSpeed(getStoredSpeed());
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    // Use BYOK key if available, otherwise server credits
    const provider = getStoredProvider();
    const byokKey = getStoredApiKey(provider);
    const apiKey = byokKey || "arbo_credits";

    const currentPrompt = prompt.trim();
    setLoading(true);
    setError("");
    setSuccess("");
    setStatusMsg("");
    setActionLog([]);

    const localActions: { type: string; label?: string }[] = [];

    // Build conversation history for the API
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
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setError("Cr\u00e9dits \u00e9puis\u00e9s. Ajoute ta cl\u00e9 API dans Param\u00e8tres > IA.");
        } else {
          setError(data.error || "Erreur de modification");
        }
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError("Erreur de connexion"); setLoading(false); return; }

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
                  onOpenChat();
                  setPrompt("");
                  setStatusMsg("");
                  Events.aiActionPerformed("chat", "built-in");
                } else {
                  const projectRes = await fetch(`/api/projects/${projectId}`);
                  if (projectRes.ok) {
                    const project = await projectRes.json();
                    initProject(project);
                  }
                  const summary = data.summary || `${data.total} modification(s) appliqu\u00e9e(s)`;
                  setSuccess(summary);
                  setPrompt("");
                  setStatusMsg("");
                  Events.aiActionPerformed("edit_tree", "built-in");
                  setTimeout(() => setSuccess(""), 4000);
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
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }, [prompt, projectId, speed, initProject, chatMessages, onChatMessage, onOpenChat]);

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 sm:bottom-5 left-0 right-0 mx-auto z-30 w-fit flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium shadow-lg transition-all duration-150 hover:scale-105 hover:shadow-xl active:scale-95"
          style={{
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "0 4px 24px var(--accent-strong)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 32px var(--accent-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px var(--accent-strong)"; }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Assistant IA
          <kbd className="ml-1 px-1.5 py-0.5 rounded text-2xs font-mono hidden sm:inline" style={{ background: "rgba(255,255,255,0.2)" }}>
            Ctrl+I
          </kbd>
        </motion.button>
      )}

      {/* AI Bar panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-3 sm:bottom-5 left-0 right-0 mx-auto z-30 w-[calc(100%-24px)] sm:w-[560px] max-w-[560px] rounded-xl overflow-hidden"
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  Assistant IA
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Speed toggle */}
                <button
                  onClick={() => { const next = speed === "fast" ? "quality" : "fast"; setSpeed(next); storeSpeed(next); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-medium transition-all duration-150 active:scale-90"
                  style={{
                    color: speed === "fast" ? "#f59e0b" : "var(--accent)",
                    background: speed === "fast" ? "rgba(245,158,11,0.1)" : "var(--accent-muted)",
                  }}
                  title={speed === "fast" ? "Mode rapide (1 cr\u00e9dit)" : "Mode qualit\u00e9 (3 cr\u00e9dits)"}
                >
                  {speed === "fast" ? <Zap className="w-3 h-3" /> : <Gem className="w-3 h-3" />}
                  {speed === "fast" ? "Rapide" : "Qualit\u00e9"}
                </button>
                {/* Credits badge */}
                <AiCreditsBadge />
                {/* Chat history button */}
                {chatMessages.length > 0 && (
                  <button
                    onClick={onOpenChat}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-medium transition-all duration-150"
                    style={{ color: "var(--text-muted)", background: "var(--surface)" }}
                    title="Ouvrir le chat"
                  >
                    Chat ({Math.floor(chatMessages.length / 2) || chatMessages.length})
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
              <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                <div className="flex gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ background: "var(--accent)" }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </div>
                <motion.p
                  className="text-2xs font-medium truncate"
                  style={{ color: "var(--text-secondary)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {statusMsg || "R\u00e9flexion en cours..."}
                </motion.p>
              </div>
            )}

            {/* Action log during processing */}
            {loading && actionLog.length > 0 && (
              <div className="px-4 py-1.5 flex flex-wrap gap-1" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                {actionLog.map((a, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    className="text-2xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: a.type === "add" ? "rgba(34,197,94,0.1)" : a.type === "delete" ? "rgba(239,68,68,0.1)" : "var(--accent-muted)",
                      color: a.type === "add" ? "#22c55e" : a.type === "delete" ? "#ef4444" : "var(--accent)",
                    }}
                  >
                    {a.type === "add" ? "+" : a.type === "delete" ? "-" : "\u270F"} {a.label || "..."}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Success message */}
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background: "var(--success-bg)" }}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-text)" }} />
                  <p className="text-2xs" style={{ color: "var(--success-text)" }}>{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--error-glow)" }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--error-text)" }} />
                <p className="text-2xs" style={{ color: "var(--error-text)" }}>{error}</p>
              </div>
            )}

            {/* Input area */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Modifie l'arbo ou pose une question..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none transition-all resize-none disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--line)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !loading) {
                      e.preventDefault();
                      handleSubmit();
                    }
                    if (e.key === "Escape") setOpen(false);
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !prompt.trim()}
                  className="self-end p-2.5 rounded-lg transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
              </div>
              <div className="hidden sm:flex items-center justify-between mt-2">
                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  Ctrl+Enter pour envoyer
                </p>
                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  Esc pour fermer
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
