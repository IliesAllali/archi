"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

export default function NewProjectButton({ variant }: { variant: "small" | "large" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const csrfToken = getCsrfToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrfToken) headers["x-csrf-token"] = csrfToken

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Nouveau projet" }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (variant === "large") {
    return (
      <button
        onClick={handleCreate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Cr{"\u00e9"}er un projet
      </button>
    )
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Plus className="w-3.5 h-3.5" />
      )}
      Nouveau
    </button>
  )
}
