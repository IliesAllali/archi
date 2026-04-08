"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Logo from "@/components/Logo";

export default function ShareAccessPage() {
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);

  // On mount: resolve token. If no password required, verify + redirect immediately.
  useEffect(() => {
    (async () => {
      try {
        const infoRes = await fetch(`/api/share/resolve?token=${encodeURIComponent(token)}`);
        if (!infoRes.ok) {
          const data = await infoRes.json().catch(() => ({}));
          setError(data.error || "Lien invalide ou expiré");
          setLoading(false);
          return;
        }

        const info = await infoRes.json();

        if (info.requiresPassword) {
          setNeedsPassword(true);
          setLoading(false);
          return;
        }

        // No password — verify and redirect directly
        const res = await fetch(`/api/projects/${info.projectId}/share/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          window.location.href = `/${info.projectId}`;
        } else {
          setError("Erreur d'accès");
          setLoading(false);
        }
      } catch {
        setError("Erreur de connexion");
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const infoRes = await fetch(`/api/share/resolve?token=${encodeURIComponent(token)}`);
      if (!infoRes.ok) {
        setError("Lien invalide");
        setLoading(false);
        return;
      }

      const info = await infoRes.json();

      const res = await fetch(`/api/projects/${info.projectId}/share/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: password.trim() }),
      });

      if (res.ok) {
        window.location.href = `/${info.projectId}`;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.includes("Mot de passe") ? "Mot de passe incorrect" : data.error || "Erreur d'accès");
        setLoading(false);
      }
    } catch {
      setError("Erreur de connexion");
      setLoading(false);
    }
  }

  // Loading state (resolving token or redirecting)
  if (loading && !needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-faint)" }} />
      </div>
    );
  }

  // Error without password form (invalid/expired link)
  if (error && !needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}
            >
              <Logo size={22} />
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--error-text)" }}>{error}</p>
        </div>
      </div>
    );
  }

  // Password form
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
      <div className="w-full max-w-[320px] mx-4">
        <div className="flex justify-center mb-6 animate-scale-fade-in">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}
          >
            <Logo size={22} />
          </div>
        </div>

        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--text-muted)" }}
          >
            <Lock className="w-3 h-3" />
            Accès protégé
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="Mot de passe du projet"
              autoFocus
              autoComplete="off"
              className="w-full h-11 pl-4 pr-12 rounded-lg text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: "var(--elevated)",
                color: "var(--text-primary)",
                border: error ? "1px solid var(--error-border)" : "1px solid var(--line-strong)",
              }}
              onFocus={(e) => {
                if (!error) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? "var(--error-border)" : "var(--line-strong)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-label-faint hover:text-label-muted transition-colors"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="h-4 flex items-center justify-center">
            {error && (
              <p className="text-2xs animate-fade-in" style={{ color: "var(--error-text)" }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--text-primary)", color: "var(--canvas-bg)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Accéder au projet"}
          </button>
        </form>
      </div>
    </div>
  );
}
