"use client"

import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { csrfHeaders } from "../use-csrf"

interface ProjectMeta {
  id: string
  slug: string
  name: string
  client: string
  version: string
  accent: string
}

const ACCENT_PRESETS = [
  "#F76B15", "#E5484D", "#E54D2E", "#EC4899",
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#0EA5E9", "#6D28D9", "#1A1A1E", "#78716C",
]

export default function GeneralTab({
  project,
  onNameChange,
}: {
  project: ProjectMeta
  onNameChange: (name: string) => void
}) {
  const [name, setName] = useState(project.name)
  const [client, setClient] = useState(project.client)
  const [version, setVersion] = useState(project.version)
  const [accent, setAccent] = useState(project.accent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Live-update CSS accent when user picks a color
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent)
    const r = parseInt(accent.slice(1, 3), 16) || 0
    const g = parseInt(accent.slice(3, 5), 16) || 0
    const b = parseInt(accent.slice(5, 7), 16) || 0
    document.documentElement.style.setProperty("--accent-muted", `rgba(${r}, ${g}, ${b}, 0.12)`)
    document.documentElement.style.setProperty("--accent-strong", `rgba(${r}, ${g}, ${b}, 0.24)`)
  }, [accent])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: csrfHeaders(),
        body: JSON.stringify({ name, client, version, accent }),
      })
      onNameChange(name)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Informations générales
        </h2>
        <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
          Paramètres de base du projet.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-muted)" }}>
          Nom du projet
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
        />
      </div>

      {/* Client */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-muted)" }}>
          Client
        </label>
        <input
          type="text"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
          placeholder="Nom du client"
        />
      </div>

      {/* Version */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-muted)" }}>
          Version
        </label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="w-full max-w-[120px] px-3 py-2 rounded-lg text-sm font-mono outline-none transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
          placeholder="v1"
        />
      </div>

      {/* Accent color */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-muted)" }}>
          Couleur d&apos;accent
        </label>
        <div className="flex items-center gap-2.5 flex-wrap">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setAccent(color)}
              className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 active:scale-95"
              style={{
                backgroundColor: color,
                boxShadow: accent === color
                  ? `0 0 0 2px var(--elevated), 0 0 0 4px ${color}`
                  : `0 1px 3px rgba(0,0,0,0.15)`,
              }}
            >
              {accent === color && (
                <Check className="w-3 h-3 mx-auto" style={{ color: "#fff", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }} />
              )}
            </button>
          ))}
          <label
            className="w-7 h-7 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 flex items-center justify-center"
            style={{
              background: "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
            title="Couleur personnalis\u00e9e"
          >
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
        {/* Live preview */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 rounded" style={{ background: accent }} />
          <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>{accent.toUpperCase()}</span>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: saved ? "var(--success-bg)" : accent,
            color: saved ? "var(--success-text)" : "#fff",
          }}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
        </button>
      </div>
    </div>
  )
}
