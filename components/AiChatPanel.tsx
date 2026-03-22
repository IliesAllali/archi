"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onClear: () => void;
  loading: boolean;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
        style={{
          background: isUser ? "var(--surface-hover)" : "var(--accent-muted)",
        }}
      >
        {isUser ? (
          <User className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        ) : (
          <Sparkles className="w-3 h-3" style={{ color: "var(--accent)" }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`flex-1 min-w-0 rounded-lg px-3 py-2 ${isUser ? "ml-8" : "mr-8"}`}
        style={{
          background: isUser ? "var(--surface-hover)" : "var(--surface)",
          border: isUser ? "none" : "1px solid var(--line)",
        }}
      >
        {isUser ? (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {msg.content}
          </p>
        ) : (
          <div className="ai-chat-markdown">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-xs leading-relaxed mb-2 last:mb-0" style={{ color: "var(--text-primary)" }}>
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{children}</strong>
                ),
                em: ({ children }) => <em>{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-xs space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-xs space-y-0.5">{children}</ol>,
                li: ({ children }) => (
                  <li className="text-xs" style={{ color: "var(--text-primary)" }}>{children}</li>
                ),
                h1: ({ children }) => <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                h2: ({ children }) => <h3 className="text-xs font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                h3: ({ children }) => <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                code: ({ children }) => (
                  <code
                    className="text-2xs px-1 py-0.5 rounded font-mono"
                    style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}
                  >
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="pl-3 my-2 text-xs italic"
                    style={{ borderLeft: "2px solid var(--accent)", color: "var(--text-muted)" }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
          {new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export default function AiChatPanel({ open, onClose, messages, onSend, onClear, loading }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }, [input, loading, onSend]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.15)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[360px] max-w-[calc(100vw-16px)] flex flex-col"
            style={{
              background: "var(--elevated)",
              borderLeft: "1px solid var(--line-strong)",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
            }}
            data-panel
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Chat IA
                </span>
                {messages.length > 0 && (
                  <span className="text-2xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--text-faint)" }}>
                    {messages.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={onClear}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: "var(--text-faint)" }}
                    title="Effacer la conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "var(--text-faint)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                  <Sparkles className="w-8 h-8" style={{ color: "var(--text-faint)" }} />
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Pose une question sur ton arborescence, demande un avis UX, ou discute de ta structure.
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: "var(--accent-muted)" }}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          background: "var(--text-faint)",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 py-3" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pose une question..."
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
                      handleSend();
                    }
                    if (e.key === "Escape") onClose();
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="self-end p-2.5 rounded-lg transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-2xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                Ctrl+Enter pour envoyer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
