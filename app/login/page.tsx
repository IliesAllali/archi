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
        router.push(redirectTo);
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
            bg-bg-elevated border transition-all duration-150
            placeholder:text-label-faint text-label-primary
            focus:outline-none focus:ring-1
            ${
              error
                ? "border-red-500/40 focus:ring-red-500/20 shake"
                : "border-line-strong focus:border-label-muted/30 focus:ring-label-muted/10"
            }
          `}
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
          <p className="text-2xs text-red-400 animate-fade-in">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !password.trim()}
        className="
          w-full h-10 rounded-lg text-sm font-medium
          bg-label-primary text-bg-base transition-all duration-150
          hover:bg-white active:scale-[0.98]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
        "
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
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-[300px] mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Logo size={22} />
          </div>
        </div>

        <Suspense fallback={<div className="h-[120px]" />}>
          <LoginForm />
        </Suspense>

        <p className="text-2xs text-label-faint text-center mt-8 select-none">
          Accès protégé
        </p>
      </div>
    </div>
  );
}
