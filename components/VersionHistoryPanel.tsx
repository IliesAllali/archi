"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, RotateCcw, Plus, Trash2, GitBranch, Upload, Loader2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { Events } from "@/lib/posthog";

interface Snapshot {
  id: string;
  trigger: string;
  triggeredBy: string;
  triggeredByType: string;
  createdAt: number;
}

const TRIGGER_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create_node: { label: "Page ajoutée", icon: Plus, color: "#2DB8A0" },
  delete_node: { label: "Page supprimée", icon: Trash2, color: "#E5534B" },
  reparent: { label: "Réorganisation", icon: GitBranch, color: "#5B8AF0" },
  bulk_import: { label: "Import", icon: Upload, color: "#E8922A" },
  restore: { label: "Restauration", icon: RotateCcw, color: "#A87FD4" },
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatAbsoluteTime(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export default function VersionHistoryPanel({ projectId, open, onClose, readOnly = false }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initProject = useCanvasStore((s) => s.initProject);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/history`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch {
      setError("Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) fetchSnapshots();
  }, [open, fetchSnapshots]);

  const handleRestore = async (snapshotId: string) => {
    setRestoring(snapshotId);
    setError(null);
    try {
      const csrfToken = document.cookie.match(/arbo_csrf=([^;]+)/)?.[1] || "";
      const res = await fetch(`/api/projects/${projectId}/history/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({ snapshotId }),
      });

      if (!res.ok) throw new Error("Erreur de restauration");

      Events.versionRestored("human");
      window.location.reload();
    } catch {
      setError("Échec de la restauration");
      setRestoring(null);
      setConfirmId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[360px] z-50 flex flex-col"
            style={{
              background: "var(--elevated)",
              borderLeft: "1px solid var(--line)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 shrink-0" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Historique</h2>
                {snapshots.length > 0 && (
                  <span className="text-2xs font-mono px-1.5 py-0.5 rounded" style={{ color: "var(--text-faint)", background: "var(--bg-hover)" }}>
                    {snapshots.length}/10
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-bg-hover transition-colors">
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto detail-scroll">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-faint)" }} />
                </div>
              )}

              {error && (
                <div className="mx-4 mt-4 p-3 rounded-lg border" style={{ borderColor: "var(--error-border)", background: "var(--error-glow)" }}>
                  <p className="text-xs" style={{ color: "var(--error-text)" }}>{error}</p>
                </div>
              )}

              {!loading && snapshots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <History className="w-8 h-8 mb-3" style={{ color: "var(--text-faint)", opacity: 0.4 }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Aucun historique</p>
                  <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                    Les snapshots sont créés automatiquement quand vous ajoutez, supprimez ou réorganisez des pages.
                  </p>
                </div>
              )}

              {!loading && snapshots.length > 0 && (
                <div className="relative px-4 py-3">
                  {/* Timeline line */}
                  <div
                    className="absolute left-[27px] top-6 bottom-6 w-px"
                    style={{ background: "var(--line)" }}
                  />

                  <div className="flex flex-col gap-1">
                    {snapshots.map((snap, i) => {
                      const meta = TRIGGER_META[snap.trigger] || TRIGGER_META.create_node;
                      const TriggerIcon = meta.icon;
                      const isConfirming = confirmId === snap.id;
                      const isRestoring = restoring === snap.id;

                      return (
                        <motion.div
                          key={snap.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
                          className="relative flex gap-3 group"
                        >
                          {/* Timeline dot */}
                          <div
                            className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-3 z-10"
                            style={{
                              background: "var(--elevated)",
                              boxShadow: `inset 0 0 0 2px ${meta.color}, inset 0 0 0 10px ${meta.color}20`,
                              transition: "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <TriggerIcon className="w-2.5 h-2.5" style={{ color: meta.color }} />
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 rounded-lg p-3"
                            style={{
                              background: isConfirming ? "var(--error-glow)" : "var(--bg-surface)",
                              transition: "background-color 150ms ease",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                                  {meta.label}
                                </p>
                                <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
                                  {formatRelativeTime(snap.createdAt)}
                                </p>
                              </div>

                              {!readOnly && (
                                <AnimatePresence mode="wait">
                                  {isConfirming ? (
                                    <motion.div
                                      key="confirm"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="flex items-center gap-1"
                                    >
                                      <button
                                        onClick={() => handleRestore(snap.id)}
                                        disabled={!!restoring}
                                        className="px-2 py-1 rounded text-2xs font-medium text-white disabled:opacity-50 active:scale-95"
                                        style={{ background: "var(--error-text)", transition: "transform 100ms ease, opacity 150ms ease" }}
                                      >
                                        {isRestoring ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Confirmer"
                                        )}
                                      </button>
                                      <button
                                        onClick={() => setConfirmId(null)}
                                        className="p-1 rounded transition-colors active:scale-95"
                                        style={{ transition: "background-color 150ms ease, transform 100ms ease" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                      >
                                        <X className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                                      </button>
                                    </motion.div>
                                  ) : (
                                    <motion.button
                                      key="restore"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      onClick={() => setConfirmId(snap.id)}
                                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-2xs border active:scale-95"
                                      style={{
                                        color: "var(--text-muted)",
                                        borderColor: "var(--line)",
                                        transition: "opacity 150ms ease, background-color 150ms ease, transform 100ms ease",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      Restaurer
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              )}
                            </div>

                            <p className="text-2xs" style={{ color: "var(--text-faint)" }} title={formatAbsoluteTime(snap.createdAt)}>
                              {formatAbsoluteTime(snap.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="text-2xs text-center" style={{ color: "var(--text-faint)" }}>
                10 snapshots max · les plus anciens sont supprimés automatiquement
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
