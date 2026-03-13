"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Lock, Check, ExternalLink } from "lucide-react";
import type { Project } from "@/lib/types";

interface ShareModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ project, open, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/${project.id}`
      : `https://arbo.vercel.app/${project.id}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-[440px] max-h-[90vh] overflow-y-auto bg-bg-elevated border border-line-strong rounded-xl shadow-2xl z-50"
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
              {/* URL */}
              <div>
                <label className="text-2xs text-label-muted uppercase tracking-wide font-medium block mb-2">
                  Lien du projet
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-line text-2xs font-mono text-label-secondary min-w-0">
                    <Link2 className="w-3 h-3 text-label-faint shrink-0" />
                    <span className="truncate">{url}</span>
                  </div>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 shrink-0"
                    style={{
                      backgroundColor: copied ? "var(--success-bg)" : "var(--accent)",
                      color: copied ? "var(--success-text)" : "white",
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              {project.password && (
                <div>
                  <label className="text-2xs text-label-muted uppercase tracking-wide font-medium block mb-2">
                    Mot de passe client
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-line">
                    <Lock className="w-3 h-3 text-label-faint shrink-0" />
                    <span className="text-sm font-mono text-label-secondary tracking-wider">
                      {project.password}
                    </span>
                  </div>
                  <p className="text-2xs text-label-faint mt-1.5 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Le client devra saisir ce mot de passe pour accéder au projet
                  </p>
                </div>
              )}

              {/* Project meta */}
              <div className="flex items-center gap-3 pt-1 border-t border-line text-2xs text-label-faint">
                <span
                  className="font-mono font-medium px-1.5 py-0.5 rounded"
                  style={{
                    color: project.accent,
                    backgroundColor: `${project.accent}18`,
                  }}
                >
                  {project.version}
                </span>
                <span>{project.nodes.length} pages</span>
                <span>{project.client}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-line text-xs text-label-muted hover:text-label-primary hover:border-line-strong transition-all duration-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
