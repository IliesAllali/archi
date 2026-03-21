"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Key, Loader2, Check, Lock, Palette, Pencil, Package, AlertTriangle, Camera, X } from "lucide-react"
import Logo from "@/components/Logo"

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

interface UserData { id: string; name: string; email: string; color: string; avatar: string | null; role: string }
interface ApiKey { id: string; provider: string; key_hint: string; label: string | null; created_at: number }

const PROVIDERS = [
  { id: "openai", label: "OpenAI", placeholder: "sk-...", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-...", url: "https://console.anthropic.com/settings/keys" },
  { id: "mistral", label: "Mistral", placeholder: "...", url: "https://console.mistral.ai/api-keys" },
]

const AVATAR_COLORS = [
  "#5E6AD2", "#E5484D", "#E54D2E", "#F76B15", "#F5D90A",
  "#46A758", "#30A46C", "#0091FF", "#6E56CF", "#AB4ABA",
]

export default function AccountClient() {
  const [user, setUser] = useState<UserData | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  // API key form
  const [showAdd, setShowAdd] = useState(false)
  const [provider, setProvider] = useState("openai")
  const [keyValue, setKeyValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile edit
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Password
  const [showPassword, setShowPassword] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [pwError, setPwError] = useState("")
  const [savingPw, setSavingPw] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  // Demo
  const [hasDemo, setHasDemo] = useState(false)
  const [deletingDemo, setDeletingDemo] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/me/api-keys").then(r => r.json()),
      fetch("/api/demo").then(r => r.json()).catch(() => ({ exists: false })),
    ]).then(([u, k, d]) => {
      setUser(u)
      setKeys(Array.isArray(k) ? k : [])
      setNameValue(u?.name || "")
      setHasDemo(!!d?.exists)
    }).finally(() => setLoading(false))
  }, [])

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    const csrf = getCsrfToken()
    if (csrf) h["x-csrf-token"] = csrf
    return h
  }

  const csrfHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {}
    const csrf = getCsrfToken()
    if (csrf) h["x-csrf-token"] = csrf
    return h
  }

  // ─── Profile actions ────────────────────────────────────────
  const saveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === user?.name) { setEditingName(false); return }
    setSavingName(true)
    const res = await fetch("/api/me", { method: "PATCH", headers: headers(), body: JSON.stringify({ name: trimmed }) })
    if (res.ok) {
      setUser(prev => prev ? { ...prev, name: trimmed } : prev)
      setEditingName(false)
    }
    setSavingName(false)
  }

  const changeColor = async (color: string) => {
    const res = await fetch("/api/me", { method: "PATCH", headers: headers(), body: JSON.stringify({ color }) })
    if (res.ok) {
      setUser(prev => prev ? { ...prev, color } : prev)
      setShowColorPicker(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 375_000) { alert("Image trop lourde (max 375KB)"); return }

    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const res = await fetch("/api/me", { method: "PATCH", headers: headers(), body: JSON.stringify({ avatar: dataUrl }) })
      if (res.ok) {
        setUser(prev => prev ? { ...prev, avatar: dataUrl } : prev)
      }
      setUploadingAvatar(false)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  const removeAvatar = async () => {
    const res = await fetch("/api/me", { method: "PATCH", headers: headers(), body: JSON.stringify({ avatar: null }) })
    if (res.ok) {
      setUser(prev => prev ? { ...prev, avatar: null } : prev)
    }
  }

  // ─── Password ───────────────────────────────────────────────
  const changePassword = async () => {
    setPwError("")
    if (newPw.length < 8) { setPwError("8 caractères minimum"); return }
    setSavingPw(true)
    const res = await fetch("/api/me", { method: "PATCH", headers: headers(), body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
    if (!res.ok) {
      const data = await res.json()
      setPwError(data.error || "Erreur")
    } else {
      setCurrentPw(""); setNewPw(""); setShowPassword(false)
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
    }
    setSavingPw(false)
  }

  // ─── API keys ───────────────────────────────────────────────
  const addKey = async () => {
    if (!keyValue.trim()) return
    setSaving(true)
    const res = await fetch("/api/me/api-keys", { method: "POST", headers: headers(), body: JSON.stringify({ provider, key: keyValue.trim() }) })
    if (res.ok) {
      const data = await res.json()
      setKeys(prev => [{ ...data, created_at: Date.now() }, ...prev])
      setKeyValue(""); setShowAdd(false); setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const deleteKey = async (keyId: string) => {
    await fetch(`/api/me/api-keys/${keyId}`, { method: "DELETE", headers: csrfHeaders() })
    setKeys(prev => prev.filter(k => k.id !== keyId))
  }

  // ─── Demo ───────────────────────────────────────────────────
  const deleteDemo = async () => {
    setDeletingDemo(true)
    const res = await fetch("/api/demo", { method: "DELETE", headers: csrfHeaders() })
    if (res.ok) {
      setHasDemo(false); setConfirmDemo(false)
    }
    setDeletingDemo(false)
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

        {/* ─── Profile ─────────────────────────────────────── */}
        {user && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Profil</h3>
            <div className="p-4 rounded-lg space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="relative group">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: user.color, color: "#fff" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Upload overlay */}
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {/* Remove avatar button */}
                  {user.avatar && (
                    <button
                      onClick={removeAvatar}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)" }}
                    >
                      <X className="w-2.5 h-2.5" style={{ color: "var(--error-text)" }} />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  {/* Color dot (when no avatar) */}
                  {!user.avatar && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}
                      onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker) }}
                    >
                      <Palette className="w-2.5 h-2.5" style={{ color: "var(--text-faint)" }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        className="h-7 px-2 rounded-md text-sm font-medium flex-1 focus:outline-none"
                        style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                        autoFocus
                        maxLength={50}
                        onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditingName(false); setNameValue(user.name) } }}
                      />
                      <button onClick={saveName} disabled={savingName} className="h-7 px-2.5 rounded-md text-2xs font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
                        {savingName ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                      <button onClick={() => { setEditingName(true); setNameValue(user.name) }} className="p-0.5 rounded hover:bg-bg-hover transition-colors" style={{ color: "var(--text-faint)" }}>
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-2xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
              </div>

              {/* Color picker (only when no avatar) */}
              {showColorPicker && !user.avatar && (
                <div className="flex gap-1.5 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => changeColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: c === user.color ? "2px solid var(--accent)" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Password ────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Mot de passe</h3>

          {pwSaved && (
            <div className="flex items-center gap-1.5 text-2xs font-medium" style={{ color: "var(--success-text)" }}>
              <Check className="w-3 h-3" /> Mot de passe modifié
            </div>
          )}

          {!showPassword ? (
            <button
              onClick={() => setShowPassword(true)}
              className="flex items-center gap-1.5 text-2xs font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              <Lock className="w-3 h-3" />
              Changer le mot de passe
            </button>
          ) : (
            <div className="p-3 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-2xs focus:outline-none"
                  style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                />
              </div>
              <div>
                <label className="text-2xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full h-9 px-3 rounded-lg text-2xs focus:outline-none"
                  style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
                  onKeyDown={e => { if (e.key === "Enter" && newPw.length >= 8) changePassword() }}
                />
              </div>
              {pwError && <p className="text-2xs" style={{ color: "var(--error-text)" }}>{pwError}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowPassword(false); setCurrentPw(""); setNewPw(""); setPwError("") }} className="px-3 h-8 rounded-lg text-2xs" style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}>
                  Annuler
                </button>
                <button
                  onClick={changePassword}
                  disabled={savingPw || !currentPw || newPw.length < 8}
                  className="flex-1 h-8 rounded-lg text-2xs font-medium disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {savingPw ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Modifier"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── API Keys ────────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Clés API</h3>
            <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Tes clés sont chiffrées et jamais partagées. Elles permettent à Arbo d{"'"}utiliser l{"'"}IA de ton choix.
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
              <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                Obtiens ta clé sur{" "}
                <a
                  href={PROVIDERS.find(p => p.id === provider)?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--accent)" }}
                >
                  {PROVIDERS.find(p => p.id === provider)?.label}
                </a>
              </p>
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

        {/* ─── Exemple project ─────────────────────────────── */}
        {hasDemo && (
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Projet exemple</h3>
              <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Le projet "E-commerce Sneakers" est un exemple inclus pour découvrir Arbo.
              </p>
            </div>

            {!confirmDemo ? (
              <button
                onClick={() => setConfirmDemo(true)}
                className="flex items-center gap-1.5 text-2xs font-medium transition-colors"
                style={{ color: "var(--error-text)" }}
              >
                <Package className="w-3 h-3" />
                Supprimer le projet exemple
              </button>
            ) : (
              <div className="p-3 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--warning-text)" }} />
                  <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                    Le projet exemple et toutes ses pages seront supprimés définitivement.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDemo(false)}
                    className="px-3 h-8 rounded-lg text-2xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--line)" }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={deleteDemo}
                    disabled={deletingDemo}
                    className="flex-1 h-8 rounded-lg text-2xs font-medium"
                    style={{ background: "var(--error-bg)", color: "var(--error-text)", border: "1px solid var(--error-border)" }}
                  >
                    {deletingDemo ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Confirmer la suppression"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  )
}
