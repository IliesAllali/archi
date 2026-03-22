"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Trash2, User } from "lucide-react";
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

/* ── Thinking indicator (Claude-style) ─────────────────────────────────────── */

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-start gap-3 px-1"
    >
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
        style={{ background: "var(--accent-muted)" }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
      </div>
      <div className="pt-1.5 flex items-center gap-2">
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-[5px] h-[5px] rounded-full"
              style={{ background: "var(--accent)" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <motion.span
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          R&eacute;flexion en cours...
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ── Message bubble ────────────────────────────────────────────────────────── */

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: isUser ? "var(--surface-hover)" : "var(--accent-muted)",
        }}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        ) : (
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`flex-1 min-w-0 rounded-xl px-4 py-3 ${isUser ? "ml-6" : "mr-2"}`}
        style={{
          background: isUser ? "var(--surface-hover)" : "var(--surface)",
          border: isUser ? "none" : "1px solid var(--line)",
        }}
      >
        {isUser ? (
          <p className="text-[13px] leading-[1.6]" style={{ color: "var(--text-primary)" }}>
            {msg.content}
          </p>
        ) : (
          <div className="ai-chat-md">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-[13px] leading-[1.7] mb-3 last:mb-0" style={{ color: "var(--text-primary)" }}>
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{children}</strong>
                ),
                em: ({ children }) => <em style={{ color: "var(--text-secondary)" }}>{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1.5" style={{ color: "var(--text-primary)" }}>{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1.5" style={{ color: "var(--text-primary)" }}>{children}</ol>,
                li: ({ children }) => (
                  <li className="text-[13px] leading-[1.6]" style={{ color: "var(--text-primary)" }}>{children}</li>
                ),
                h1: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                h2: ({ children }) => <h3 className="text-[13px] font-bold mb-2 mt-3 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                h3: ({ children }) => <h3 className="text-[13px] font-semibold mb-1.5 mt-2.5 first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h3>,
                code: ({ children }) => (
                  <code
                    className="text-2xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "var(--surface-hover)", color: "var(--accent)" }}
                  >
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="pl-3.5 my-3 text-[13px]"
                    style={{ borderLeft: "3px solid var(--accent)", color: "var(--text-muted)" }}
                  >
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3" style={{ borderColor: "var(--line)" }} />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        <p className="text-2xs mt-2 opacity-40">
          {new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */

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

  // Scroll to bottom + focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        inputRef.current?.focus();
      }, 100);
    }
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
            style={{ background: "rgba(0,0,0,0.12)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 420 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 420 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[440px] max-w-[calc(100vw-16px)] flex flex-col"
            style={{
              background: "var(--elevated)",
              borderLeft: "1px solid var(--line-strong)",
              boxShadow: "-12px 0 48px rgba(0,0,0,0.12)",
            }}
            data-panel
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 shrink-0"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Chat IA
                </span>
                {messages.length > 0 && (
                  <span
                    className="text-2xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--surface)", color: "var(--text-faint)" }}
                  >
                    {Math.ceil(messages.length / 2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={onClear}
                    className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
                    style={{ color: "var(--text-faint)" }}
                    title="Effacer la conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--text-faint)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <Sparkles className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Assistant IA
                    </p>
                    <p className="text-xs leading-relaxed max-w-[260px]" style={{ color: "var(--text-faint)" }}>
                      Pose une question sur ton arborescence, demande un avis UX, ou discute de ta structure.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <AnimatePresence>
                {loading && <ThinkingIndicator />}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="flex gap-2.5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pose une question..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-[13px] focus:outline-none transition-all resize-none disabled:opacity-50"
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
                  className="self-end p-2.5 rounded-xl transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-2xs mt-2 px-1" style={{ color: "var(--text-faint)" }}>
                Ctrl+Enter pour envoyer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
