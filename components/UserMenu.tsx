"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { resetUser } from "@/lib/posthog"

interface UserData {
  id: string
  name: string
  email: string
  color: string
  avatar: string | null
  role: string
}

export default function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(setUser)
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
          className="absolute right-0 top-full mt-1.5 w-56 rounded-lg overflow-hidden"
          style={{ background: "var(--elevated)", border: "1px solid var(--line-strong)", boxShadow: "var(--modal-shadow)", zIndex: 100 }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
            <p className="text-2xs truncate" style={{ color: "var(--text-faint)" }}>{user.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push("/account") }}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-left transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Settings className="w-3.5 h-3.5" />
              Mon compte
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-left transition-colors"
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
