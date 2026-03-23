"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, Sparkles } from "lucide-react"
import { resetUser } from "@/lib/posthog"

interface UserData {
  id: string
  name: string
  email: string
  color: string
  avatar: string | null
  role: string
}

interface Credits {
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
}

export default function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(setUser)
    fetch("/api/me/ai-credits").then(r => r.ok ? r.json() : null).then(setCredits).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    resetUser()
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (!user) return null

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      {user.avatar ? (
        <button onClick={() => setOpen(!open)} className="transition-transform hover:scale-105" title={user.name}>
          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-105"
          style={{ background: user.color, color: "#fff" }}
          title={user.name}
        >
          {initial}
        </button>
      )}

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-lg overflow-hidden animate-dropdown-in"
          style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)", zIndex: 100 }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
            <p className="text-2xs truncate" style={{ color: "var(--text-faint)" }}>{user.email}</p>
          </div>

          {credits && (
            <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" style={{ color: credits.creditsRemaining <= 0 ? "#ef4444" : credits.creditsRemaining <= 3 ? "#eab308" : "var(--accent)" }} />
                  <span className="text-2xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {credits.creditsRemaining} crédit{credits.creditsRemaining !== 1 ? "s" : ""} IA
                  </span>
                </div>
                <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>
                  {credits.creditsRemaining}/{credits.creditsTotal}
                </span>
              </div>
              {/* Mini bar */}
              <div className="w-full h-1 rounded-full overflow-hidden mt-1.5" style={{ background: "rgba(128,128,128,0.12)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${credits.creditsTotal > 0 ? (credits.creditsRemaining / credits.creditsTotal) * 100 : 0}%`,
                    background: credits.creditsRemaining <= 0 ? "#ef4444" : credits.creditsRemaining <= 3 ? "#eab308" : "var(--accent)",
                  }}
                />
              </div>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push("/account") }}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-left transition-[background-color] duration-150 ease-in-out active:scale-95 origin-center"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Settings className="w-3.5 h-3.5" />
              Mon compte
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-left transition-[background-color] duration-150 ease-in-out active:scale-95 origin-center"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <LogOut className="w-3.5 h-3.5" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
