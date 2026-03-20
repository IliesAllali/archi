"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Key, Loader2, Check } from "lucide-react"
import Logo from "@/components/Logo"

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

interface UserData { id: string; name: string; email: string; color: string; role: string }
interface ApiKey { id: string; provider: string; key_hint: string; label: string | null; created_at: number }

const PROVIDERS = [
  { id: "openai", label: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { id: "mistral", label: "Mistral", placeholder: "..." },
]

export default function AccountClient() {
  const [user, setUser] = useState<UserData | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [provider, setProvider] = useState("openai")
  const [keyValue, setKeyValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/me/api-keys").then(r => r.json()),
    ]).then(([u, k]) => {
      setUser(u)
      setKeys(Array.isArray(k) ? k : [])
    }).finally(() => setLoading(false))
  }, [])

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    const csrf = getCsrfToken()
    if (csrf) h["x-csrf-token"] = csrf
    return h
  }

  const addKey = async () => {
    if (!keyValue.trim()) return
    setSaving(true)
    const res = await fetch("/api/me/api-keys", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ provider, key: keyValue.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setKeys(prev => [{ ...data, created_at: Date.now() }, ...prev])
      setKeyValue("")
      setShowAdd(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const deleteKey = async (keyId: string) => {
    const csrf = getCsrfToken()
    const h: Record<string, string> = {}
    if (csrf) h["x-csrf-token"] = csrf
    await fetch(`/api/me/api-keys/${keyId}`, { method: "DELETE", headers: h })
    setKeys(prev => prev.filter(k => k.id !== keyId))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-faint)" }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
      <header
        className="flex items-center justify-between px-3 h-11 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-1.5">
          <Link href="/" className="p-1.5 rounded-md hover:bg-bg-hover transition-colors" style={{ color: "var(--text-faint)" }}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}>
            <Logo size={12} />
          </div>
          <span style={{ color: "var(--text-faint)" }} className="select-none text-xs">/</span>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Mon compte</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile */}
        {user && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Profil</h3>
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: user.color, color: "#fff" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                <p className="text-2xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
              </div>
            </div>
          </section>
        )}

        {/* API Keys */}
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Clés API</h3>
            <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Tes clés sont chiffrées et jamais partagées. Elles permettent à Arbo d'utiliser l'IA de ton choix.
            </p>
          </div>

          {saved && (
            <div className="flex items-center gap-1.5 text-2xs font-medium" style={{ color: "var(--success-text)" }}>
              <Check className="w-3 h-3" /> Clé ajoutée
            </div>
          )}

          {keys.length > 0 && (
            <div className="space-y-1.5">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <div className="flex items-center gap-2.5">
                    <Key className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                    <div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {PROVIDERS.find(p => p.id === k.provider)?.label || k.provider}
                      </span>
                      <span className="text-2xs ml-2 font-mono" style={{ color: "var(--text-faint)" }}>{k.key_hint}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteKey(k.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: "var(--text-faint)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-2xs font-medium transition-colors" style={{ color: "var(--accent)" }}>
              <Plus className="w-3 h-3" />
              Ajouter une clé API
            </button>
          ) : (
            <div className="p-3 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Provider</label>
                <div className="flex gap-1.5">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className="px-3 py-1.5 rounded-md text-2xs font-medium transition-all"
                      style={{
                        background: provider === p.id ? "var(--accent)" : "var(--elevated)",
                        color: provider === p.id ? "#fff" : "var(--text-muted)",
                        border: provider === p.id ? "1px solid var(--accent)" : "1px solid var(--line)",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Clé API</label>
                <input
                  type="password"
                  value={keyValue}
                  onChange={e => setKeyValue(e.target.value)}
                  placeholder={PROVIDERS.find(p => p.id === provider)?.placeholder}
                  className="w-full h-9 px-3 rounded-lg text-2xs font-mono focus:outline-none"
                  style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                  onKeyDown={e => { if (e.key === "Enter" && keyValue.trim()) addKey() }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="px-3 h-8 rounded-lg text-2xs" style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}>
                  Annuler
                </button>
                <button
                  onClick={addKey}
                  disabled={saving || !keyValue.trim()}
                  className="flex-1 h-8 rounded-lg text-2xs font-medium disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Enregistrer"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
