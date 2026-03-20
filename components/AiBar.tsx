"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Send, X, Check, AlertTriangle, Settings } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { Events } from "@/lib/posthog";
import {
  getStoredProvider,
  getStoredApiKey,
  storeApiKey,
  getProviderConfig,
} from "@/lib/ai-providers";
import type { AiProvider } from "@/lib/ai-providers";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

interface Props {
  projectId: string;
}

export default function AiBar({ projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [actionLog, setActionLog] = useState<{ type: string; label?: string }[]>([]);
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [provider, setProvider] = useState<AiProvider>("anthropic");
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
      const p = getStoredProvider();
      setProvider(p);
      const key = getStoredApiKey(p);
      setNeedsKey(!key);
      setKeyInput(key);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    const apiKey = getStoredApiKey(provider);
    if (!apiKey) {
      setNeedsKey(true);
      setError("Cl\u00e9 API requise");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setStatusMsg("");
    setActionLog([]);

    try {
      const csrf = getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrf) headers["x-csrf-token"] = csrf;

      const res = await fetch("/api/ai/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: prompt.trim(),
          apiKey,
          projectId,
          provider,
        }),
      });

      // Non-SSE error (auth, rate limit, bad request)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && data.error?.includes("Cl")) {
          setNeedsKey(true);
        }
        setError(data.error || "Erreur de modification");
        setLoading(false);
        return;
      }

      // Read SSE stream
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
                setActionLog((prev) => [...prev, { type: data.type, label: data.label }]);
                setStatusMsg(`${data.index}/${data.index} ${data.type === "add" ? "+" : data.type === "delete" ? "-" : "\u270F"} ${data.label || data.id}`);
              } else if (currentEvent === "done") {
                // Reload project with final tree
                const projectRes = await fetch(`/api/projects/${projectId}`);
                if (projectRes.ok) {
                  const project = await projectRes.json();
                  initProject(project);
                }
                setSuccess(data.summary || `${data.total} modification(s) appliqu\u00e9e(s)`);
                setPrompt("");
                setStatusMsg("");
                Events.aiActionPerformed("edit_tree", "built-in");
                setTimeout(() => setSuccess(""), 4000);
              } else if (currentEvent === "error") {
                setError(data.error);
                if (data.error?.includes("Cl")) setNeedsKey(true);
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
  }, [prompt, projectId, provider, initProject]);

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    storeApiKey(keyInput, provider);
    setNeedsKey(false);
    setError("");
  };

  const providerConfig = getProviderConfig(provider);

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 sm:bottom-5 left-0 right-0 mx-auto z-30 w-fit flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(99, 102, 241, 0.35)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Modifier avec l&apos;IA
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
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  Éditer avec l&apos;IA
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNeedsKey((v) => !v)}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: "var(--text-faint)" }}
                  title="Clé API"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: "var(--text-faint)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* API Key input (if needed) */}
            {needsKey && (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Clé API {providerConfig.label.split(" (")[0]}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={providerConfig.placeholder}
                    className="flex-1 h-8 px-3 rounded-lg text-2xs font-mono focus:outline-none"
                    style={{
                      background: "var(--elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--line-strong)",
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveKey() }}
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={!keyInput.trim()}
                    className="px-3 h-8 rounded-lg text-2xs font-medium transition-all disabled:opacity-40"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    OK
                  </button>
                </div>
                <p className="text-2xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                  Stockée dans ton navigateur uniquement.{" "}
                  <a
                    href={providerConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Obtenir une clé
                  </a>
                </p>
              </div>
            )}

            {/* Live status during AI processing */}
            {loading && statusMsg && (
              <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: "#8B5CF6" }} />
                <p className="text-2xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>{statusMsg}</p>
              </div>
            )}

            {/* Action log during processing */}
            {loading && actionLog.length > 0 && (
              <div className="px-4 py-1.5 flex flex-wrap gap-1" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                {actionLog.map((a, i) => (
                  <span
                    key={i}
                    className="text-2xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: a.type === "add" ? "rgba(34,197,94,0.1)" : a.type === "delete" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)",
                      color: a.type === "add" ? "#22c55e" : a.type === "delete" ? "#ef4444" : "#8B5CF6",
                    }}
                  >
                    {a.type === "add" ? "+" : a.type === "delete" ? "-" : "\u270F"} {a.label || "..."}
                  </span>
                ))}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--success-bg)" }}>
                <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--success-text)" }} />
                <p className="text-2xs" style={{ color: "var(--success-text)" }}>{success}</p>
              </div>
            )}

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
                  placeholder="Ex : Ajoute une page FAQ sous Contact, Réorganise le blog en catégories..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none transition-all resize-none disabled:opacity-50"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--line)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
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
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
