"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Archive, Loader2 } from "lucide-react"
import { csrfHeaders } from "../use-csrf"

export default function DangerTab({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const router = useRouter()
  const [archiving, setArchiving] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [transferEmail, setTransferEmail] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState("")
  const [transferDone, setTransferDone] = useState(false)

  const handleArchive = async () => {
    if (confirmName !== projectName) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: csrfHeaders(),
      })
      if (res.ok) {
        window.location.href = "/"
      }
    } finally {
      setArchiving(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferEmail.trim()) return
    setTransferring(true)
    setTransferError("")
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: csrfHeaders(),
        body: JSON.stringify({ transferTo: transferEmail.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setTransferError(data.error || "Erreur")
        return
      }
      setTransferDone(true)
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--error-text)" }}>
          Zone danger
        </h2>
        <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
          Actions irréversibles. Procédez avec prudence.
        </p>
      </div>

      {/* Transfer ownership */}
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Transférer la propriété
        </h3>
        <p className="text-2xs mb-3" style={{ color: "var(--text-muted)" }}>
          Transférez ce projet à un autre utilisateur. Vous deviendrez éditeur.
        </p>
        {transferDone ? (
          <p className="text-xs" style={{ color: "var(--success-text)" }}>
            Demande de transfert envoyée.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              placeholder="Email du nouveau propriétaire"
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--line)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
            />
            <button
              onClick={handleTransfer}
              disabled={transferring || !transferEmail.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background: "rgba(220,38,38,0.08)",
                color: "var(--error-text)",
                border: "1px solid var(--error-border)",
              }}
            >
              {transferring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Transférer"}
            </button>
          </div>
        )}
        {transferError && (
          <p className="text-2xs mt-2" style={{ color: "var(--error-text)" }}>{transferError}</p>
        )}
      </div>

      {/* Archive project */}
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--error-border)" }}
      >
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--error-text)" }} />
          <div>
            <h3 className="text-xs font-semibold" style={{ color: "var(--error-text)" }}>
              Archiver le projet
            </h3>
            <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Le projet ne sera plus visible dans le dashboard. Cette action peut être annulée par un administrateur.
            </p>
          </div>
        </div>
        <div>
          <label className="text-2xs block mb-1.5" style={{ color: "var(--text-muted)" }}>
            Tapez <strong style={{ color: "var(--text-primary)" }}>{projectName}</strong> pour confirmer
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--error-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={handleArchive}
              disabled={archiving || confirmName !== projectName}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background: confirmName === projectName ? "var(--error-text)" : "rgba(220,38,38,0.08)",
                color: confirmName === projectName ? "#fff" : "var(--error-text)",
                border: "1px solid var(--error-border)",
              }}
            >
              {archiving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              Archiver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
