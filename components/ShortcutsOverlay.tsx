"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface ShortcutRow {
  keys: string[];
  label: string;
}

const SHORTCUTS: { section: string; rows: ShortcutRow[] }[] = [
  {
    section: "Navigation",
    rows: [
      { keys: ["⌘", "K"], label: "Rechercher une page" },
      { keys: ["⌘", "F"], label: "Ajuster la vue (fit)" },
      { keys: ["↑", "↓"], label: "Naviguer dans la liste" },
      { keys: ["↵"], label: "Sélectionner" },
    ],
  },
  {
    section: "Panneau",
    rows: [
      { keys: ["Esc"], label: "Fermer le panneau / la recherche" },
    ],
  },
  {
    section: "Canvas",
    rows: [
      { keys: ["Scroll"], label: "Zoom" },
      { keys: ["Drag"], label: "Déplacer la vue" },
    ],
  },
];

export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        // Don't trigger if typing in an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-100 hover:scale-105 active:scale-90"
        style={{
          background: "var(--controls-bg)",
          border: "1px solid var(--line)",
          color: "var(--controls-fill)",
        }}
        data-tooltip="Raccourcis clavier (?)"
      >
        <Keyboard className="w-3.5 h-3.5" />
      </button>

      {/* Overlay */}
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
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[20%] -translate-x-1/2 w-[360px] z-50 rounded-xl overflow-hidden"
              style={{
                background: "var(--elevated)",
                border: "1px solid var(--line-strong)",
                boxShadow: "var(--modal-shadow)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Raccourcis clavier
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-bg-hover transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {/* Sections */}
              <div className="px-4 py-3 space-y-5">
                {SHORTCUTS.map((section) => (
                  <div key={section.section}>
                    <p
                      className="text-2xs uppercase tracking-widest font-medium mb-2.5"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {section.section}
                    </p>
                    <div className="space-y-1.5">
                      {section.rows.map((row, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {row.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {row.keys.map((key, j) => (
                              <kbd
                                key={j}
                                className="text-2xs font-mono px-1.5 py-0.5 rounded leading-none"
                                style={{
                                  background: "var(--surface)",
                                  border: "1px solid var(--line-strong)",
                                  color: "var(--text-muted)",
                                  boxShadow: "0 1px 0 var(--line-strong)",
                                }}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div
                className="px-4 py-2.5 flex items-center justify-center"
                style={{ borderTop: "1px solid var(--line-subtle)" }}
              >
                <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                  Appuyez sur{" "}
                  <kbd
                    className="font-mono px-1 py-0.5 rounded"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      color: "var(--text-faint)",
                    }}
                  >
                    ?
                  </kbd>{" "}
                  pour ouvrir / fermer
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
