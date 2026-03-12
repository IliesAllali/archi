"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, project: searchParams.get("project") }),
      });

      if (res.ok) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-label-faint" />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Mot de passe"
          autoFocus
          className={`
            w-full h-10 pl-10 pr-4 rounded-lg text-sm
            bg-bg-surface border transition-all duration-150
            placeholder:text-label-faint text-label-primary
            focus:outline-none focus:ring-1
            ${
              error
                ? "border-red-500/50 focus:ring-red-500/30"
                : "border-line focus:border-accent/50 focus:ring-accent/20"
            }
          `}
        />
      </div>

      {error && (
        <p className="text-2xs text-red-400 text-center animate-fade-in">
          Mot de passe incorrect
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="
          w-full h-10 rounded-lg text-sm font-medium
          bg-accent text-white transition-all duration-150
          hover:brightness-110 active:brightness-95
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {loading ? "…" : "Accéder"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-[320px] mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-bg-surface border border-line flex items-center justify-center">
            <span className="text-lg font-semibold text-label-primary">a</span>
          </div>
        </div>

        <Suspense fallback={<div className="h-[120px]" />}>
          <LoginForm />
        </Suspense>

        <p className="text-2xs text-label-faint text-center mt-6">
          Accès protégé par mot de passe
        </p>
      </div>
    </div>
  );
}
