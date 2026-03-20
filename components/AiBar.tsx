"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Send, X, Check, AlertTriangle, Settings } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { Events } from "@/lib/posthog";

function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("arbo_anthropic_key") || "";
}

function storeApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (key.trim()) localStorage.setItem("arbo_anthropic_key", key.trim());
}

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
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
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
      const key = getStoredApiKey();
      setNeedsKey(!key);
      setKeyInput(key);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setNeedsKey(true);
      setError("Cl\u00e9 API Anthropic requise");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

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
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Reload the project to reflect changes
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (projectRes.ok) {
          const project = await projectRes.json();
          initProject(project);
        }

        setSuccess(data.summary || `${data.applied?.length || 0} modification(s) appliqu\u00e9e(s)`);
        setPrompt("");
        Events.aiActionPerformed("edit_tree", "built-in");

        // Auto-close success after 3s
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && data.error?.includes("Cl\u00e9")) {
          setNeedsKey(true);
        }
        setError(data.error || "Erreur de modification");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [prompt, projectId, initProject]);

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    storeApiKey(keyInput);
    setNeedsKey(false);
    setError("");
  };

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(99, 102, 241, 0.35)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Modifier avec l&apos;IA
          <kbd className="ml-1 px-1.5 py-0.5 rounded text-2xs font-mono" style={{ background: "rgba(255,255,255,0.2)" }}>
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
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-32px)] sm:w-[560px] rounded-xl overflow-hidden"
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  \u00c9diter avec l&apos;IA
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNeedsKey((v) => !v)}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: "var(--text-faint)" }}
                  title="Cl\u00e9 API"
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
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Cl\u00e9 API Anthropic
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-ant-..."
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
                  Stock\u00e9e dans ton navigateur uniquement.{" "}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Obtenir une cl\u00e9
                  </a>
                </p>
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
            <div className="px-4 py-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex : Ajoute une page FAQ sous Contact, R\u00e9organise le blog en cat\u00e9gories..."
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
              <div className="flex items-center justify-between mt-2">
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
