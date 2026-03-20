"use client";

import { Suspense, useState, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.ok) {
        window.location.href = redirectTo;
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Identifiants incorrects");
        emailRef.current?.focus();
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError?: boolean) => ({
    background: "var(--elevated)",
    color: "var(--text-primary)",
    border: hasError ? "1px solid var(--error-border)" : "1px solid var(--line-strong)",
    boxShadow: hasError ? "0 0 0 3px var(--error-glow)" : undefined,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          placeholder="Email"
          autoFocus
          autoComplete="email"
          className="w-full h-11 px-4 rounded-lg text-sm transition-all duration-200 focus:outline-none"
          style={inputStyle(!!error)}
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
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
          placeholder="Mot de passe"
          autoComplete="current-password"
          className="w-full h-11 pl-4 pr-12 rounded-lg text-sm transition-all duration-200 focus:outline-none"
          style={inputStyle(!!error)}
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
        disabled={loading || !email.trim() || !password}
        className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "var(--text-primary)", color: "var(--canvas-bg)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Se connecter"}
      </button>

      <p className="text-2xs text-center pt-2" style={{ color: "var(--text-faint)" }}>
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
      <div className="w-full max-w-[320px] mx-4">
        <div className="flex justify-center mb-8 animate-scale-fade-in">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}
          >
            <Logo size={22} />
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <Suspense fallback={<div className="h-[200px]" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
