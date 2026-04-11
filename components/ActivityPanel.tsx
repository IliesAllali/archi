"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  X,
  Plus,
  Trash2,
  GitBranch,
  Upload,
  RotateCcw,
  Edit3,
  Bot,
  User,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  type: "create_node" | "delete_node" | "reparent" | "bulk_import" | "restore" | "update_node" | "ai_action";
  actor: string;
  actorType: "human" | "ai";
  label?: string;
  timestamp: number;
}

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, typeof Plus> = {
  create_node: Plus,
  delete_node: Trash2,
  reparent: GitBranch,
  bulk_import: Upload,
  restore: RotateCcw,
  update_node: Edit3,
  ai_action: Bot,
};

const LABEL_MAP: Record<string, string> = {
  create_node: "a ajouté",
  delete_node: "a supprimé",
  reparent: "a déplacé",
  bulk_import: "a importé",
  restore: "a restauré",
  update_node: "a modifié",
  ai_action: "action IA",
};

const COLOR_MAP: Record<string, string> = {
  create_node: "#22C55E",
  delete_node: "#EF4444",
  reparent: "#F76B15",
  bulk_import: "#F59E0B",
  restore: "#8B5CF6",
  update_node: "#06B6D4",
  ai_action: "#EC4899",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function ActivityPanel({ projectId, open, onClose }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const socketRef = useRef<any>(null);

  // Fetch initial activity from audit log
  useEffect(() => {
    if (!open) return;

    fetch(`/api/projects/${projectId}/history`)
      .then((r) => r.json())
      .then((snapshots) => {
        if (!Array.isArray(snapshots)) return;
        const mapped: ActivityEntry[] = snapshots.slice(0, 20).map((s: any) => ({
          id: s.id,
          type: s.trigger,
          actor: s.triggeredBy || s.triggered_by || "Inconnu",
          actorType: s.triggeredByType || s.triggered_by_type || "human",
          timestamp: s.createdAt || s.created_at,
        }));
        setEntries(mapped);
      })
      .catch(() => {});
  }, [open, projectId]);

  // Listen for live events from Socket.IO
  useEffect(() => {
    if (!open) return;

    const handleAiAction = (data: { tokenName: string; action: string; nodeLabel?: string }) => {
      setEntries((prev) => [
        {
          id: `live_${Date.now()}`,
          type: "ai_action",
          actor: data.tokenName,
          actorType: "ai",
          label: data.nodeLabel,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 29),
      ]);
    };

    const handleNodesUpdated = (data: { source?: string; tokenName?: string }) => {
      if (data.source === "ai" && data.tokenName) {
        const name = data.tokenName;
        setEntries((prev) => [
          {
            id: `sync_${Date.now()}`,
            type: "update_node" as const,
            actor: name,
            actorType: "ai" as const,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 29),
        ]);
      }
    };

    // Hook into global socket if available
    const io = (window as any).__arboSocket;
    if (io) {
      io.on("ai-action", handleAiAction);
      io.on("nodes-updated", handleNodesUpdated);
      socketRef.current = io;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("ai-action", handleAiAction);
        socketRef.current.off("nodes-updated", handleNodesUpdated);
      }
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col"
            style={{
              background: "var(--surface)",
              borderLeft: "1px solid var(--line)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Activité
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-bg-hover transition-[background-color,transform] duration-150 ease-out active:scale-[0.93]"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <Activity className="w-8 h-8" style={{ color: "var(--text-faint)" }} />
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    Aucune activité pour le moment
                  </p>
                </div>
              ) : (
                entries.map((entry, i) => {
                  const Icon = ICON_MAP[entry.type] || Activity;
                  const color = COLOR_MAP[entry.type] || "var(--text-muted)";
                  const verb = LABEL_MAP[entry.type] || entry.type;
                  const isLive = entry.id.startsWith("live_") || entry.id.startsWith("sync_");

                  return (
                    <motion.div
                      key={entry.id}
                      initial={isLive ? { opacity: 0, y: -8 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={isLive ? { duration: 0.2, ease: "easeOut" } : { duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
                      className="flex items-start gap-2.5 py-2 px-1.5 rounded-md group"
                      style={{ transition: "background-color 150ms ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          background: `${color}15`,
                          transition: "box-shadow 150ms ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 0 3px ${color}25`}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                      >
                        <Icon className="w-3 h-3" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-tight" style={{ color: "var(--text-primary)" }}>
                          <span className="font-medium">
                            {entry.actorType === "ai" ? (
                              <span className="inline-flex items-center gap-0.5">
                                <Bot className="w-3 h-3 inline" />
                                {entry.actor}
                              </span>
                            ) : (
                              entry.actor
                            )}
                          </span>{" "}
                          {verb}
                          {entry.label && (
                            <span className="font-medium"> {entry.label}</span>
                          )}
                        </p>
                        <p className="text-2xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                          {timeAgo(entry.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
