"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Check, AlertTriangle, Users } from "lucide-react"
import Logo from "@/components/Logo"

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-faint)" }} />
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}

function JoinContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [status, setStatus] = useState<"loading" | "joining" | "success" | "error" | "login_required">("loading")
  const [error, setError] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("Lien d\u2019invitation invalide.")
      return
    }

    // Try to join immediately
    ;(async () => {
      try {
        setStatus("joining")
        const res = await fetch("/api/workspaces/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        if (res.ok) {
          const data = await res.json()
          setStatus("success")
          // Redirect to dashboard after a moment
          setTimeout(() => {
            window.location.href = "/"
          }, 2000)
        } else if (res.status === 401) {
          // Not logged in — redirect to login then back here
          setStatus("login_required")
        } else {
          const data = await res.json().catch(() => ({}))
          setStatus("error")
          if (data.error === "Email mismatch") {
            setError(`Cette invitation est pour ${data.expected}. Connecte-toi avec ce compte.`)
          } else if (data.error === "Invalid or expired invitation") {
            setError("Invitation expir\u00e9e ou d\u00e9j\u00e0 utilis\u00e9e.")
          } else {
            setError(data.error || "Erreur")
          }
        }
      } catch {
        setStatus("error")
        setError("Erreur de connexion")
      }
    })()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--canvas-bg)" }}>
      <div
        className="w-full max-w-sm rounded-xl p-8 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--modal-shadow)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--accent-muted)" }}>
          {status === "success" ? (
            <Check className="w-5 h-5" style={{ color: "var(--accent)" }} />
          ) : status === "error" ? (
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--error-text)" }} />
          ) : (
            <Users className="w-5 h-5" style={{ color: "var(--accent)" }} />
          )}
        </div>

        {(status === "loading" || status === "joining") && (
          <>
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Connexion au workspace...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Bienvenue dans l&apos;&eacute;quipe !
            </h2>
            <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
              Redirection vers le dashboard...
            </p>
          </>
        )}

        {status === "login_required" && (
          <>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Connecte-toi pour rejoindre
            </h2>
            <p className="text-2xs mb-5" style={{ color: "var(--text-muted)" }}>
              Tu dois te connecter ou cr&eacute;er un compte pour accepter l&apos;invitation.
            </p>
            <a
              href={`/login?redirect=${encodeURIComponent(`/join?token=${token}`)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Se connecter
            </a>
            <p className="text-[10px] mt-3" style={{ color: "var(--text-faint)" }}>
              Pas encore de compte ?{" "}
              <a
                href={`/signup?redirect=${encodeURIComponent(`/join?token=${token}`)}`}
                className="underline"
                style={{ color: "var(--accent)" }}
              >
                Cr&eacute;er un compte
              </a>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Invitation invalide
            </h2>
            <p className="text-2xs mb-5" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "var(--surface-hover)", color: "var(--text-primary)" }}
            >
              Retour au dashboard
            </a>
          </>
        )}

        <div className="mt-6 pt-4 flex justify-center" style={{ borderTop: "1px solid var(--line)" }}>
          <Logo size={14} />
          <span className="text-[10px] ml-1.5" style={{ color: "var(--text-faint)" }}>arbo</span>
        </div>
      </div>
    </div>
  )
}
