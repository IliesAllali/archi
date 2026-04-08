"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Check, Loader2, Eye, EyeOff, Type } from "lucide-react"
import { csrfHeaders } from "../use-csrf"
import type { WireframeSettings, WireframeFidelity } from "@/lib/types"
import {
  DEFAULT_WIREFRAME_SETTINGS,
  WIREFRAME_FIDELITY_CONFIG,
  WIREFRAME_FONT_PRESETS,
} from "@/lib/types"

const FIDELITY_OPTIONS: { value: WireframeFidelity; icon: string }[] = [
  { value: "lo-fi", icon: "Lo" },
  { value: "mid-fi", icon: "Mid" },
  { value: "hi-fi", icon: "Hi" },
]

export default function WireframeTab({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState<WireframeSettings>(DEFAULT_WIREFRAME_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fontsLoadedRef = useRef(false)

  // Load all Google Fonts once for live preview
  useEffect(() => {
    if (fontsLoadedRef.current) return
    fontsLoadedRef.current = true
    const families = WIREFRAME_FONT_PRESETS.map(f => `family=${f.replace(/\s+/g, "+")}:wght@400;600`).join("&")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const project = await res.json()
        if (project.wireframeSettings) {
          setSettings({ ...DEFAULT_WIREFRAME_SETTINGS, ...project.wireframeSettings })
        }
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: csrfHeaders(),
        body: JSON.stringify({ wireframeSettings: settings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Wireframes
        </h2>
        <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
          Configurez le rendu et la visibilite des wireframes du projet.
        </p>
      </div>

      {/* Fidelity selector */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)" }}>
          Niveau de fidelite
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FIDELITY_OPTIONS.map(({ value, icon }) => {
            const config = WIREFRAME_FIDELITY_CONFIG[value]
            const isActive = settings.fidelity === value
            return (
              <button
                key={value}
                onClick={() => setSettings(s => ({ ...s, fidelity: value }))}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl transition-all text-center"
                style={{
                  background: isActive ? "var(--accent-muted)" : "var(--surface)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {/* Fidelity preview block */}
                <div
                  className="w-full h-16 rounded-lg flex flex-col gap-1 p-2 overflow-hidden"
                  style={{
                    background: value === "lo-fi"
                      ? "#F4F4F5"
                      : value === "mid-fi"
                      ? "#FAFAFA"
                      : "#FFFFFF",
                    border: "1px solid var(--line)",
                  }}
                >
                  {value === "lo-fi" && (
                    <>
                      <div className="h-1.5 w-full rounded" style={{ background: "#D1D5DB" }} />
                      <div className="flex gap-1 flex-1">
                        <div className="flex-1 rounded" style={{ background: "#E5E7EB" }} />
                        <div className="flex-1 rounded" style={{ background: "#E5E7EB" }} />
                      </div>
                      <div className="h-1 w-8 rounded" style={{ background: "#9CA3AF" }} />
                    </>
                  )}
                  {value === "mid-fi" && (
                    <>
                      <div className="h-1.5 w-full rounded" style={{ background: "#CBD5E1" }} />
                      <div className="flex gap-1 flex-1">
                        <div className="flex-1 rounded" style={{ background: "#E2E8F0" }} />
                        <div className="flex-1 rounded" style={{ background: "#E2E8F0" }} />
                      </div>
                      <div className="h-1.5 w-10 rounded-sm" style={{ background: "#64748B" }} />
                    </>
                  )}
                  {value === "hi-fi" && (
                    <>
                      <div className="h-1.5 w-full rounded" style={{ background: "#3B82F6" }} />
                      <div className="flex gap-1 flex-1">
                        <div className="flex-1 rounded" style={{ background: "#DBEAFE" }} />
                        <div className="flex-1 rounded" style={{ background: "#FEF3C7" }} />
                      </div>
                      <div className="h-1.5 w-10 rounded-sm" style={{ background: "#2563EB" }} />
                    </>
                  )}
                </div>
                <div>
                  <span
                    className="text-xs font-semibold block"
                    style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    {config.label}
                  </span>
                  <span className="text-2xs leading-tight block mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {config.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Font selector */}
      <div>
        <label className="text-2xs font-medium uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)" }}>
          <Type className="w-3 h-3 inline mr-1 -mt-px" />
          Police des wireframes
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {WIREFRAME_FONT_PRESETS.map((font) => {
            const isActive = settings.font === font
            return (
              <button
                key={font}
                onClick={() => setSettings(s => ({ ...s, font }))}
                className="px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background: isActive ? "var(--accent-muted)" : "var(--surface)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                <span
                  className="text-xs font-semibold block truncate"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {font}
                </span>
                <span
                  className="block mt-0.5 truncate"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: `"${font}", sans-serif`,
                    fontSize: 13,
                    lineHeight: "1.3",
                  }}
                >
                  Titre de page
                </span>
                <span
                  className="block truncate"
                  style={{
                    color: "var(--text-faint)",
                    fontFamily: `"${font}", sans-serif`,
                    fontSize: 10,
                  }}
                >
                  Corps de texte — Aa Bb 123
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-2xs mt-2" style={{ color: "var(--text-faint)" }}>
          La police est chargee via Google Fonts dans les wireframes generes.
        </p>
      </div>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: saved ? "var(--success-bg)" : "var(--accent)",
            color: saved ? "var(--success-text)" : "#fff",
          }}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {saving ? "Enregistrement..." : saved ? "Enregistre" : "Enregistrer"}
        </button>
      </div>
    </div>
  )
}
