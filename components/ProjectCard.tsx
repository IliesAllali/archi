"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/${project.id}`}
      className="group block animate-fade-in-up"
      style={{ opacity: 0, animationDelay: `${60 + index * 50}ms` }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-150 hover:translate-x-1 active:scale-[0.99]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--line-strong)";
          e.currentTarget.style.background = "var(--surface-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--line)";
          e.currentTarget.style.background = "var(--surface)";
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-150"
            style={{ backgroundColor: project.accent }}
          />
          <div className="min-w-0">
            <span
              className="text-sm font-medium block truncate transition-colors duration-100"
              style={{ color: "var(--text-secondary)" }}
            >
              {project.name}
            </span>
            <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
              {project.client}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span
            className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded"
            style={{ color: project.accent, backgroundColor: `${project.accent}18` }}
          >
            {project.version}
          </span>
          <span className="text-2xs hidden sm:block" style={{ color: "var(--text-faint)" }}>
            {formattedDate}
          </span>
          <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>
            {project.nodes.length}p
          </span>
          <span
            className="text-xs opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-0 group-hover:translate-x-1"
            style={{ color: "var(--text-faint)" }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
