"use client";

import { Suspense, useState, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { Events } from "@/lib/posthog";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.redirect) {
        // First user — auto-verified, auto-logged in
        Events.userSignedUp("direct");
        window.location.href = data.redirect;
        return;
      } else if (res.ok) {
        Events.userSignedUp("direct");
        setSuccess(data.message || "Compte cr\u00e9\u00e9. V\u00e9rifiez votre email.");
      } else {
        setError(data.error || "Erreur lors de l'inscription");
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
  });

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div
          className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-lg"
          style={{ background: "var(--success-bg)", color: "var(--success-text)" }}
        >
          {"\u2713"}
        </div>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{success}</p>
        <Link
          href="/login"
          className="inline-block text-2xs font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Retour au login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        ref={nameRef}
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
        placeholder="Nom"
        autoFocus
        autoComplete="name"
        className="w-full h-11 px-4 rounded-lg text-sm transition-all duration-200 focus:outline-none"
        style={inputStyle()}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--line-strong)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
        placeholder="Email"
        autoComplete="email"
        className="w-full h-11 px-4 rounded-lg text-sm transition-all duration-200 focus:outline-none"
        style={inputStyle()}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--line-strong)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
          placeholder="Mot de passe (8 caract\u00e8res min.)"
          autoComplete="new-password"
          className="w-full h-11 pl-4 pr-12 rounded-lg text-sm transition-all duration-200 focus:outline-none"
          style={inputStyle()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--line-strong)";
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
        disabled={loading || !name.trim() || !email.trim() || password.length < 8}
        className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "var(--text-primary)", color: "var(--canvas-bg)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Cr\u00e9er mon compte"}
      </button>

      <p className="text-2xs text-center pt-2" style={{ color: "var(--text-faint)" }}>
        D\u00e9j\u00e0 un compte ?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
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

        <h1
          className="text-sm font-semibold text-center mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          Cr{"\u00e9"}er un compte
        </h1>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
          <Suspense fallback={<div className="h-[280px]" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
