"use client";

import { Suspense, useState, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useT } from "@/lib/app-i18n";

function LoginForm() {
  const t = useT();
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
        setError(data.error || t("login.errorInvalidCredentials"));
        emailRef.current?.focus();
      }
    } catch {
      setError(t("login.errorConnection"));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {justVerified && (
        <div
          className="px-4 py-3 rounded-lg text-2xs text-center animate-fade-in"
          style={{ background: "var(--success-bg)", color: "var(--success-text)" }}
        >
          {t("login.emailConfirmed")}
        </div>
      )}

      <div>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          placeholder={t("login.emailPlaceholder")}
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
          placeholder={t("login.passwordPlaceholder")}
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
            {resending ? t("login.resending") : t("login.resendVerification")}
          </button>
        )}
        {resendSuccess && (
          <p className="text-2xs animate-fade-in" style={{ color: "var(--success-text)" }}>
            {t("login.emailResent")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "var(--text-primary)", color: "var(--canvas-bg)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : t("login.submitButton")}
      </button>

      <p className="text-2xs text-center pt-2" style={{ color: "var(--text-faint)" }}>
        {t("login.noAccount")}{" "}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          {t("login.createAccount")}
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
