"use client";

import { Suspense, useState, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const projectId = searchParams.get("project");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim(), project: projectId }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // If auth returned a matched project, redirect there
        const destination = data.project ? `/${data.project}` : redirectTo;
        router.push(destination);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Mot de passe incorrect");
        inputRef.current?.select();
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative group">
        <input
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="Mot de passe"
          autoFocus
          autoComplete="current-password"
          className={`
            w-full h-10 pl-4 pr-10 rounded-lg text-sm
            transition-all duration-200
            focus:outline-none
            ${
              error
                ? "shake"
                : ""
            }
          `}
          style={{
            background: "var(--elevated)",
            color: "var(--text-primary)",
            border: error ? "1px solid var(--error-border)" : "1px solid var(--line-strong)",
            boxShadow: error ? "0 0 0 3px var(--error-glow)" : undefined,
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
        disabled={loading || !password.trim()}
        className="
          w-full h-10 rounded-lg text-sm font-medium
          transition-all duration-150
          active:scale-[0.98]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
        "
        style={{
          background: "var(--text-primary)",
          color: "var(--canvas-bg)",
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mx-auto animate-spin" />
        ) : (
          "Accéder"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
      <div className="w-full max-w-[300px] mx-4">
        {/* Logo — scale in */}
        <div className="flex justify-center mb-8 animate-scale-fade-in">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--card-title-bg)",
              border: "1px solid var(--card-ring)",
            }}
          >
            <Logo size={22} />
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <Suspense fallback={<div className="h-[120px]" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p
          className="text-2xs text-center mt-8 select-none animate-fade-in"
          style={{ color: "var(--text-faint)", animationDelay: "300ms", opacity: 0 }}
        >
          Accès protégé
        </p>
      </div>
    </div>
  );
}
