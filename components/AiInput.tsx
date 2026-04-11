"use client"

import { useState, useRef, useCallback, type KeyboardEvent, type DragEvent, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Paperclip, X, FileText, Send } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AttachedFile {
  id: string
  name: string
  type: string        // "image/png", "application/pdf", etc.
  base64: string      // raw base64 (no data: prefix)
  dataUrl: string     // full data URL for preview
  size: number        // bytes
}

interface AiInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (text: string, files: AttachedFile[]) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
  onEscape?: () => void
  /** "Enter" (default, AiBar) or "Ctrl+Enter" (AiChatPanel) */
  sendKey?: "enter" | "ctrl+enter"
  /** Compact mode for AiBar (smaller padding/rounding) */
  compact?: boolean
  /** Extra class on the outer wrapper */
  className?: string
  /** Ref forwarded to the textarea */
  textareaRef?: React.Ref<HTMLTextAreaElement>
  /** Show a send button (default true). Pass false + custom sendButton to use your own. */
  showSendButton?: boolean
  /** Custom send button renderer — receives handleSend */
  renderSendButton?: (handleSend: () => void) => ReactNode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILES = 5
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
const ACCEPT_STRING = "image/jpeg,image/png,image/gif,image/webp,application/pdf"

function fileId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AiInput({
  value,
  onChange,
  onSend,
  placeholder = "Pose une question...",
  disabled = false,
  rows = 2,
  onEscape,
  sendKey = "ctrl+enter",
  compact = false,
  className = "",
  textareaRef,
  showSendButton = true,
  renderSendButton,
}: AiInputProps) {
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const internalRef = useRef<HTMLTextAreaElement>(null)

  // ─── File processing ─────────────────────────────────────────────────────

  const processFiles = useCallback((fileList: FileList | File[]) => {
    setError(null)
    const incoming = Array.from(fileList)

    for (const f of incoming) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`Format non supporté : ${f.name}`)
        return
      }
      if (f.size > MAX_SIZE_BYTES) {
        setError(`Fichier trop lourd (max 10 Mo) : ${f.name}`)
        return
      }
    }

    setFiles(prev => {
      const remaining = MAX_FILES - prev.length
      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES} fichiers`)
        return prev
      }
      const toAdd = incoming.slice(0, remaining)

      toAdd.forEach(f => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(",")[1] || ""
          setFiles(cur => [
            ...cur,
            { id: fileId(), name: f.name, type: f.type, base64, dataUrl, size: f.size },
          ])
        }
        reader.readAsDataURL(f)
      })

      return prev // actual additions happen async via reader.onload
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setError(null)
  }, [])

  // ─── Drag & drop ─────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  // ─── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (disabled) return
    if (!value.trim() && files.length === 0) return
    onSend(value.trim(), files)
    setFiles([])
    setError(null)
  }, [value, files, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendKey === "ctrl+enter" && e.key === "Enter" && (e.metaKey || e.ctrlKey) && !disabled) {
      e.preventDefault()
      handleSend()
    }
    if (sendKey === "enter" && e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape" && onEscape) onEscape()
  }, [sendKey, disabled, handleSend, onEscape])

  // ─── Paste ────────────────────────────────────────────────────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const pastedFiles: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile()
        if (file) pastedFiles.push(file)
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault()
      processFiles(pastedFiles)
    }
  }, [processFiles])

  // ─── Styles ───────────────────────────────────────────────────────────────

  const rounding = compact ? "rounded-lg" : "rounded-xl"
  const pad = compact ? "px-2.5 py-2" : "px-3.5 py-2.5"
  const textSize = compact ? "text-xs" : "text-[13px]"
  const btnPad = compact ? "p-2" : "p-2.5"

  return (
    <div
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-10 ${rounding} flex items-center justify-center pointer-events-none`}
            style={{
              background: "var(--surface)",
              border: "2px dashed var(--accent)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              Glisser-déposer ici
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] mb-1.5 px-1"
            style={{ color: "var(--error, #ef4444)" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {/* Textarea wrapper with paperclip inside */}
        <div
          className={`flex-1 flex flex-col ${rounding} transition-[border-color] duration-150 ease-out`}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
          }}
        >
          {/* File chips inside field */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1.5 px-2.5 pt-2"
              >
                {files.map(f => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-md text-[11px]"
                    style={{ background: "var(--bg-hover, var(--canvas-bg))", border: "1px solid var(--line)" }}
                  >
                    {f.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.dataUrl} alt={f.name} className="w-6 h-6 rounded object-cover shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                    )}
                    <span className="max-w-[100px] truncate" style={{ color: "var(--text-primary)" }} title={`${f.name} (${formatSize(f.size)})`}>
                      {f.name}
                    </span>
                    <button onClick={() => removeFile(f.id)} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10" style={{ color: "var(--text-faint)" }}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef || internalRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`w-full ${pad} ${textSize} focus:outline-none transition-opacity resize-none disabled:opacity-50 bg-transparent`}
            onFocus={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.borderColor = "var(--accent)"
            }}
            onBlur={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.borderColor = "var(--line)"
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />

          {/* Bottom bar: paperclip inside field */}
          <div className="flex items-center px-2 pb-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1 rounded transition-[transform,background-color] duration-125 ease-out hover:bg-black/5 active:scale-[0.93] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "var(--text-faint)" }}
              title="Joindre un fichier ou coller (Ctrl+V)"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Send button */}
        {renderSendButton
          ? renderSendButton(handleSend)
          : showSendButton && (
            <button
              onClick={handleSend}
              disabled={disabled || (!value.trim() && files.length === 0)}
              className={`${btnPad} ${rounding} transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
      </div>
    </div>
  )
}
