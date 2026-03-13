"use client";

import type { Project } from "@/lib/types";
import Canvas from "@/components/Tree/Canvas";
import Logo from "@/components/Logo";

interface Props {
  project: Project;
}

export default function CanvasPage({ project }: Props) {
  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--canvas-bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 h-11 shrink-0 z-20"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: "var(--card-title-bg)",
              border: "1px solid var(--card-ring)",
            }}
          >
            <Logo size={14} />
          </div>
          <span style={{ color: "var(--text-faint)" }} className="select-none">/</span>
          <span className="text-sm font-medium truncate max-w-[300px]" style={{ color: "var(--text-primary)" }}>
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-2xs">
          <span className="font-mono" style={{ color: "var(--text-muted)" }}>{project.client}</span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span
            className="font-medium px-1.5 py-0.5 rounded"
            style={{
              color: project.accent,
              backgroundColor: `${project.accent}18`,
            }}
          >
            {project.version}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{formattedDate}</span>
          <div className="w-px h-3" style={{ background: "var(--line)" }} />
          <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
            {project.nodes.length} pages
          </span>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas project={project} />
      </div>
    </div>
  );
}
