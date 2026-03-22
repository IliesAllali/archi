"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, ArrowUp } from "lucide-react";
import type { SiteNode } from "@/lib/types";

interface Props {
  node: SiteNode | null;
  onClose: () => void;
  onDelete: (mode: "cascade" | "reparent") => void;
}

export default function DeleteNodeModal({ node, onClose, onDelete }: Props) {
  if (!node) return null;

  const childCount = node.children.length;

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[420px] max-w-[90vw] rounded-xl overflow-hidden"
            style={{
              background: "var(--elevated)",
              border: "1px solid var(--line)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.24)",
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.12)" }}
                  animate={{
                    rotate: [0, -3, 3, -3, 3, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    ease: "easeInOut",
                  }}
                >
                  <AlertTriangle className="w-4.5 h-4.5" style={{ color: "#EF4444" }} />
                </motion.div>
                <div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Supprimer "{node.label}" ?
                  </h3>
                  <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                    Cette page a {childCount} sous-page{childCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="px-5 pb-3 flex flex-col gap-2">
              <button
                onClick={() => onDelete("cascade")}
                className="flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <Trash2 className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#EF4444" }}>
                    Supprimer tout
                  </p>
                  <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                    Supprime la page et toutes ses sous-pages
                  </p>
                </div>
              </button>

              <button
                onClick={() => onDelete("reparent")}
                className="flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                <ArrowUp className="w-4 h-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Remonter les enfants
                  </p>
                  <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
                    Supprime la page et remonte ses sous-pages au niveau parent
                  </p>
                </div>
              </button>
            </div>

            {/* Cancel */}
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[var(--surface-hover)] active:scale-95"
                style={{
                  color: "var(--text-muted)",
                  background: "transparent",
                }}
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
