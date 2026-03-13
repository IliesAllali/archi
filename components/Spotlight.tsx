"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  LayoutGrid,
  FileText,
  PenLine,
  Sparkles,
  HelpCircle,
  SearchIcon,
  AlertTriangle,
  Scale,
} from "lucide-react";
import type { SiteNode, PageType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<PageType, React.ElementType> = {
  home: Home,
  listing: LayoutGrid,
  detail: FileText,
  form: PenLine,
  landing: Sparkles,
  quiz: HelpCircle,
  search: SearchIcon,
  error: AlertTriangle,
  legal: Scale,
};

const TYPE_LABEL: Record<PageType, string> = {
  home: "Accueil",
  listing: "Listing",
  detail: "Détail",
  form: "Formulaire",
  landing: "Landing",
  quiz: "Quiz",
  search: "Recherche",
  error: "Erreur",
  legal: "Légal",
};

const PRIORITY_COLORS: Record<string, string> = {
  primary: "bg-label-faint/60",
  secondary: "bg-label-faint/30",
  utility: "bg-label-faint/15",
};

interface SpotlightProps {
  nodes: SiteNode[];
  onSelect: (node: SiteNode) => void;
}

export default function Spotlight({ nodes, onSelect }: SpotlightProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        if (!open) {
          setQuery("");
          setActiveIndex(0);
        }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim().length === 0
    ? nodes
    : nodes.filter((n) =>
        n.label.toLowerCase().includes(query.toLowerCase()) ||
        n.description?.toLowerCase().includes(query.toLowerCase()) ||
        n.type.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        onSelect(filtered[activeIndex]);
        close();
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-item]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 backdrop-blur-[2px]"
            style={{ backgroundColor: "var(--overlay-bg)" }}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[12%] sm:top-[18%] -translate-x-1/2 w-[calc(100%-24px)] sm:w-[520px] bg-bg-elevated border border-line-strong rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ boxShadow: "var(--modal-shadow)" }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
              <Search className="w-4 h-4 text-label-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une page…"
                className="flex-1 bg-transparent text-sm text-label-primary placeholder:text-label-faint outline-none caret-accent"
              />
              <div className="hidden sm:flex items-center gap-1">
                <kbd className="text-2xs text-label-faint border border-line rounded px-1.5 py-0.5 font-mono leading-none">
                  ↑↓
                </kbd>
                <kbd className="text-2xs text-label-faint border border-line rounded px-1.5 py-0.5 font-mono leading-none">
                  ↵
                </kbd>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-label-muted">Aucune page trouvée</p>
                  <p className="text-2xs text-label-faint mt-1">Essayez un autre terme</p>
                </div>
              ) : (
                filtered.map((node, i) => {
                  const Icon = ICON_MAP[node.type];
                  const isActive = i === activeIndex;
                  return (
                    <div
                      key={node.id}
                      data-item
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-75",
                        isActive ? "bg-bg-hover" : "hover:bg-bg-hover/60"
                      )}
                      onClick={() => { onSelect(node); close(); }}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                          isActive ? "bg-accent-muted" : "bg-bg-active"
                        )}
                      >
                        <Icon
                          className="w-3 h-3"
                          style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          isActive ? "text-label-primary" : "text-label-secondary"
                        )}>
                          {node.label}
                        </p>
                        {node.description && (
                          <p className="text-2xs text-label-faint truncate mt-0.5">
                            {node.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-2xs text-label-faint">{TYPE_LABEL[node.type]}</span>
                        <span
                          className={cn(
                            "inline-block w-1.5 h-1.5 rounded-full",
                            PRIORITY_COLORS[node.priority]
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-line flex items-center justify-between text-2xs text-label-faint">
              <span>{filtered.length} page{filtered.length !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="border border-line rounded px-1 py-0.5 font-mono">↵</kbd> Ouvrir
                </span>
                <span>
                  <kbd className="border border-line rounded px-1 py-0.5 font-mono">esc</kbd> Fermer
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
