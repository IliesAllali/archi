"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Project } from "@/lib/types";
import type { PlanTier } from "@/lib/plans";
import ProjectCard from "@/components/ProjectCard";
import NewProjectButton from "@/components/NewProjectButton";

interface WorkspaceLite {
  id: string;
  name: string;
  ownerId: string;
  planTier: PlanTier;
  role: "owner" | "admin" | "editor";
}

interface Props {
  workspaces: WorkspaceLite[];
  projects: Project[];
  demo: Project | null;
  currentUserId: string;
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

export default function HomeClient({ workspaces, projects: initialProjects, demo, currentUserId }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Group projects by workspace_id. Projects without a workspace go into the primary (first owned).
  const primaryWorkspaceId = workspaces.find((w) => w.role === "owner")?.id ?? workspaces[0]?.id ?? null;

  const grouped = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const ws of workspaces) map.set(ws.id, []);
    for (const p of projects) {
      const wsId = p.workspaceId || primaryWorkspaceId;
      if (wsId && map.has(wsId)) {
        map.get(wsId)!.push(p);
      } else if (primaryWorkspaceId && map.has(primaryWorkspaceId)) {
        map.get(primaryWorkspaceId)!.push(p);
      }
    }
    return map;
  }, [projects, workspaces, primaryWorkspaceId]);

  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) ?? null : null;

  // Single-workspace mode: fall back to flat list (no sections, no dnd visuals).
  const flatMode = workspaces.length <= 1;

  async function moveProject(projectId: string, targetWorkspaceId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if ((project.workspaceId || primaryWorkspaceId) === targetWorkspaceId) return;
    if (project.ownerId !== currentUserId) {
      setMoveError("Seul le propriétaire peut déplacer un projet.");
      setTimeout(() => setMoveError(null), 3000);
      return;
    }

    const prevWorkspaceId = project.workspaceId ?? null;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, workspaceId: targetWorkspaceId } : p))
    );

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const csrf = getCsrfToken();
      if (csrf) headers["x-csrf-token"] = csrf;
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ workspaceId: targetWorkspaceId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur");
    } catch (err) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, workspaceId: prevWorkspaceId } : p))
      );
      setMoveError(err instanceof Error ? err.message : "Impossible de déplacer le projet.");
      setTimeout(() => setMoveError(null), 3000);
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveProjectId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveProjectId(null);
    if (!e.over) return;
    moveProject(String(e.active.id), String(e.over.id));
  }

  if (flatMode) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <p
            className="text-2xs uppercase tracking-widest font-medium"
            style={{ color: "var(--text-faint)" }}
          >
            Projets récents
          </p>
          <NewProjectButton variant="small" />
        </div>
        <div className="space-y-1.5">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        {demo && (
          <div className="mt-8">
            <p
              className="text-2xs uppercase tracking-widest font-medium mb-3"
              style={{ color: "var(--text-faint)" }}
            >
              Exemple
            </p>
            <ProjectCard project={demo} index={projects.length} />
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex items-center justify-end mb-4">
        <NewProjectButton variant="small" />
      </div>

      {moveError && (
        <div
          className="mb-4 px-3 py-2 rounded-md text-2xs"
          style={{ background: "var(--error-glow)", border: "1px solid var(--error-border)", color: "var(--error-text)" }}
        >
          {moveError}
        </div>
      )}

      <div className="space-y-8">
        {workspaces.map((ws) => (
          <WorkspaceSection
            key={ws.id}
            workspace={ws}
            projects={grouped.get(ws.id) ?? []}
            currentUserId={currentUserId}
            isDragging={!!activeProjectId}
          />
        ))}
      </div>

      {demo && (
        <div className="mt-8">
          <p
            className="text-2xs uppercase tracking-widest font-medium mb-3"
            style={{ color: "var(--text-faint)" }}
          >
            Exemple
          </p>
          <ProjectCard project={demo} index={projects.length} />
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {activeProject ? <ProjectCardPreview project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function WorkspaceSection({
  workspace,
  projects,
  currentUserId,
  isDragging,
}: {
  workspace: WorkspaceLite;
  projects: Project[];
  currentUserId: string;
  isDragging: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: workspace.id });

  const roleLabel =
    workspace.role === "owner"
      ? "Owner"
      : workspace.role === "admin"
      ? "Admin"
      : "Membre";

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p
            className="text-2xs uppercase tracking-widest font-medium"
            style={{ color: "var(--text-faint)" }}
          >
            {workspace.name}
          </p>
          {workspace.role !== "owner" && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="space-y-1.5 rounded-lg transition-[background-color,border-color,padding] duration-150"
        style={{
          padding: isDragging ? 8 : 0,
          background: isOver ? "var(--accent-muted)" : "transparent",
          border: `1px dashed ${isOver ? "var(--accent)" : isDragging ? "var(--line)" : "transparent"}`,
          minHeight: projects.length === 0 ? 48 : undefined,
        }}
      >
        {projects.length === 0 ? (
          <p
            className="text-2xs text-center py-3"
            style={{ color: "var(--text-faint)" }}
          >
            {isDragging ? "Déposer ici" : "Aucun projet dans cet espace"}
          </p>
        ) : (
          projects.map((project, i) => (
            <DraggableProject
              key={project.id}
              project={project}
              index={i}
              canDrag={project.ownerId === currentUserId}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DraggableProject({
  project,
  index,
  canDrag,
}: {
  project: Project;
  index: number;
  canDrag: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: !canDrag,
  });

  if (!canDrag) {
    return <ProjectCard project={project} index={index} />;
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <ProjectCard project={project} index={index} />
    </div>
  );
}

// Lightweight version for the drag overlay — doesn't use Link (would hijack clicks).
function ProjectCardPreview({ project }: { project: Project }) {
  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg shadow-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-strong)",
        boxShadow: `0 8px 24px ${project.accent}33`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: project.accent }}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium block truncate" style={{ color: "var(--text-secondary)" }}>
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
      </div>
    </div>
  );
}

