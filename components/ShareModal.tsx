"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Lock, Check, Plus, Loader2, Trash2, Eye } from "lucide-react";
import type { Project } from "@/lib/types";

interface ShareLink {
  id: string;
  token: string;
  hasPassword: boolean;
  permissions: string;
  expiresAt: number | null;
  visitCount: number;
  createdAt: number;
}

interface ShareModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

export default function ShareModal({ project, open, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/projects/${project.id}/share`)
        .then((r) => r.json())
        .then((data) => setLinks(Array.isArray(data) ? data : []))
        .finally(() => setLoading(false));
    }
  }, [open, project.id]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const createLink = async () => {
    setCreating(true);
    const csrf = getCsrfToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (csrf) headers["x-csrf-token"] = csrf;

    const res = await fetch(`/api/projects/${project.id}/share`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        password: newPassword.trim() || undefined,
        permissions: "view",
      }),
    });

    if (res.ok) {
      const link = await res.json();
      setLinks((prev) => [link, ...prev]);
      setNewPassword("");
      setShowCreate(false);
    }
    setCreating(false);
  };

  const deleteLink = async (linkId: string) => {
    const csrf = getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrf) headers["x-csrf-token"] = csrf;

    await fetch(`/api/projects/${project.id}/share/${linkId}`, {
      method: "DELETE",
      headers,
    });
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  const copyLink = async (token: string) => {
    const url = `${baseUrl}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 backdrop-blur-[2px]"
            style={{ backgroundColor: "var(--overlay-bg)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-[480px] max-h-[90vh] overflow-y-auto bg-bg-elevated border border-line-strong rounded-xl shadow-2xl z-50"
            style={{ boxShadow: "var(--modal-shadow)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
              <div>
                <h3 className="text-sm font-semibold text-label-primary">Partager le projet</h3>
                <p className="text-2xs text-label-faint mt-0.5">{project.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-bg-hover active:bg-bg-active transition-colors"
              >
                <X className="w-4 h-4 text-label-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Create new link */}
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110"
                  style={{ backgroundColor: `${project.accent}15`, color: project.accent }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cr{"\u00e9"}er un lien de partage
                </button>
              ) : (
                <div className="p-3 rounded-lg space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <div>
                    <label className="text-2xs text-label-muted block mb-1.5">
                      Mot de passe (optionnel)
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide = acc\u00e8s libre"
                      className="w-full h-9 px-3 rounded-md text-xs focus:outline-none"
                      style={{
                        background: "var(--elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--line-strong)",
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createLink}
                      disabled={creating}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all disabled:opacity-50"
                      style={{ backgroundColor: project.accent, color: "#fff" }}
                    >
                      {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      Cr{"\u00e9"}er
                    </button>
                    <button
                      onClick={() => { setShowCreate(false); setNewPassword(""); }}
                      className="px-3 h-9 rounded-md text-xs text-label-muted hover:text-label-primary transition-colors"
                      style={{ border: "1px solid var(--line)" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Existing links */}
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-label-faint" />
                </div>
              ) : links.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-2xs uppercase tracking-wide font-medium" style={{ color: "var(--text-faint)" }}>
                    Liens actifs
                  </p>
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-2xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                          <Link2 className="w-3 h-3 text-label-faint shrink-0" />
                          /share/{link.token.slice(0, 8)}...
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-2xs" style={{ color: "var(--text-faint)" }}>
                          {link.hasPassword && (
                            <span className="flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Prot{"\u00e9"}g{"\u00e9"}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> {link.visitCount} visite{link.visitCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyLink(link.token)}
                        className="px-2.5 py-1.5 rounded-md text-2xs font-medium transition-all shrink-0"
                        style={{
                          backgroundColor: copied === link.token ? "var(--success-bg)" : `${project.accent}15`,
                          color: copied === link.token ? "var(--success-text)" : project.accent,
                        }}
                      >
                        {copied === link.token ? <Check className="w-3 h-3" /> : "Copier"}
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-1.5 rounded-md text-label-faint hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-center py-4" style={{ color: "var(--text-faint)" }}>
                  Aucun lien de partage
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
