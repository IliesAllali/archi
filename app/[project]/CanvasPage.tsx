"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Project, SiteNode } from "@/lib/types";
import Canvas from "@/components/Tree/Canvas";
import Logo from "@/components/Logo";
import Spotlight from "@/components/Spotlight";
import ShareModal from "@/components/ShareModal";
import ExportButton from "@/components/ExportButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Share2, ChevronLeft, Command } from "lucide-react";

interface Props {
  project: Project;
}

export default function CanvasPage({ project }: Props) {
  const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleSpotlightSelect = useCallback((node: SiteNode) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "var(--canvas-bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-2 sm:px-3 h-11 shrink-0 z-20"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {/* Left — breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Link
            href="/"
            className="p-2 sm:p-1.5 rounded-md hover:bg-bg-hover transition-colors duration-100 text-label-faint hover:text-label-muted active:scale-95 shrink-0"
            data-tooltip="Retour"
          >
            <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </Link>
          <div
            className="w-5 h-5 rounded-md items-center justify-center shrink-0 hidden sm:flex"
            style={{
              background: "var(--card-title-bg)",
              border: "1px solid var(--card-ring)",
            }}
          >
            <Logo size={12} />
          </div>
          <span style={{ color: "var(--text-faint)" }} className="select-none text-xs hidden sm:block">/</span>
          <span
            className="text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-[280px]"
            style={{ color: "var(--text-primary)" }}
          >
            {project.name}
          </span>
        </div>

        {/* Center — meta (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 text-2xs absolute left-1/2 -translate-x-1/2">
          <span className="font-mono" style={{ color: "var(--text-muted)" }}>
            {project.client}
          </span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span
            className="font-medium px-1.5 py-0.5 rounded font-mono"
            style={{
              color: project.accent,
              backgroundColor: `${project.accent}18`,
            }}
          >
            {project.version}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{formattedDate}</span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span className="tabular-nums font-mono" style={{ color: "var(--text-muted)" }}>
            {project.nodes.length}p
          </span>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Cmd+K hint (desktop only) */}
          <button
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
              window.dispatchEvent(e);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Rechercher une page"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono">K</span>
          </button>

          {/* Cmd+F hint (desktop only) */}
          <button
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "f", metaKey: true, bubbles: true });
              window.dispatchEvent(e);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-md text-2xs text-label-faint hover:text-label-muted hover:bg-bg-hover transition-all duration-100 active:scale-95"
            data-tooltip="Ajuster la vue"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono">F</span>
          </button>

          <ThemeToggle />

          <div className="w-px h-4 bg-line mx-1 hidden sm:block" />

          <ExportButton project={project} />

          {/* Share */}
          <button
            onClick={() => setShareOpen(true)}
            className="share-btn flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-md text-xs sm:text-2xs font-medium transition-all duration-150 hover:brightness-125 active:scale-95"
            style={{
              backgroundColor: `${project.accent}20`,
              color: project.accent,
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          project={project}
          externalSelectedNode={selectedNode}
          onExternalSelectClear={() => setSelectedNode(null)}
        />
      </div>

      {/* Spotlight */}
      <Spotlight nodes={project.nodes} onSelect={handleSpotlightSelect} />

      {/* Share modal */}
      <ShareModal project={project} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
