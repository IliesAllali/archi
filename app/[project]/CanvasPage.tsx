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
    <div className="flex flex-col h-screen bg-bg-base">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-11 border-b border-line shrink-0 z-20 bg-bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Logo size={14} />
          </div>
          <span className="text-label-faint select-none">/</span>
          <span className="text-sm font-medium text-label-primary truncate max-w-[300px]">
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-2xs">
          <span className="text-label-muted font-mono">{project.client}</span>
          <div className="w-px h-3 bg-line" />
          <span
            className="font-medium px-1.5 py-0.5 rounded"
            style={{
              color: project.accent,
              backgroundColor: `${project.accent}18`,
            }}
          >
            {project.version}
          </span>
          <span className="text-label-muted">{formattedDate}</span>
          <div className="w-px h-3 bg-line" />
          <span className="text-label-muted tabular-nums">
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
