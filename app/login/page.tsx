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
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const justVerified = searchParams.get("verified") === "1";

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

  const needsVerification = error.includes("confirmer votre adresse");

  async function handleResend() {
    if (!email.trim()) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResendSuccess(true);
    } catch {
      // Silently fail — anti-enumeration
    } finally {
      setResending(false);
    }
  }

  const inputStyle = (hasError?: boolean) => ({
    background: "var(--elevated)",
    color: "var(--text-primary)",
    border: hasError ? "1px solid var(--error-border)" : "1px solid var(--line-strong)",
    boxShadow: hasError ? "0 0 0 3px var(--error-glow)" : undefined,
  });

  function handleGoogleLogin() {
    const params = new URLSearchParams({ redirect: redirectTo });
    window.location.href = `/api/auth/google?${params}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2.5"
        style={{ background: "var(--elevated)", color: "var(--text-primary)", border: "1px solid var(--line-strong)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px" style={{ background: "var(--line-strong)" }} />
        <span className="text-2xs" style={{ color: "var(--text-faint)" }}>ou</span>
        <div className="flex-1 h-px" style={{ background: "var(--line-strong)" }} />
      </div>

      {justVerified && (
        <div
          className="px-4 py-3 rounded-lg text-2xs text-center animate-fade-in"
          style={{ background: "var(--success-bg)", color: "var(--success-text)" }}
        >
          Email confirm\u00e9 ! Vous pouvez maintenant vous connecter.
        </div>
      )}

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

      <div className="flex flex-col items-center justify-center gap-1 min-h-[16px]">
        {error && (
          <p className="text-2xs animate-fade-in" style={{ color: "var(--error-text)" }}>
            {error}
          </p>
        )}
        {needsVerification && !resendSuccess && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-2xs font-medium hover:underline transition-opacity disabled:opacity-50"
            style={{ color: "var(--accent)" }}
          >
            {resending ? "Envoi en cours..." : "Renvoyer l\u2019email de confirmation"}
          </button>
        )}
        {resendSuccess && (
          <p className="text-2xs animate-fade-in" style={{ color: "var(--success-text)" }}>
            Email renvoy\u00e9 ! V\u00e9rifiez votre bo\u00eete mail.
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
      <div className="w-full max-w-[320px] sm:max-w-[380px] mx-4">
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
