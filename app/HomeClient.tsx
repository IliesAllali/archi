"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, MoreHorizontal, Pencil, UserPlus, Trash2, X, Check, Mail } from "lucide-react";
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
import { WORKSPACE_LIMIT, type PlanTier } from "@/lib/plans";
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
  planTier: PlanTier;
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/arbo_csrf=([^;]+)/);
  return match ? match[1] : null;
}

function authedFetch(url: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const csrf = getCsrfToken();
  if (csrf) headers["x-csrf-token"] = csrf;
  return fetch(url, { ...init, headers });
}

export default function HomeClient({
  workspaces: initialWorkspaces,
  projects: initialProjects,
  demo,
  currentUserId,
  planTier,
}: Props) {
  const [workspaces, setWorkspaces] = useState<WorkspaceLite[]>(initialWorkspaces);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [creatingWs, setCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [inviteModalFor, setInviteModalFor] = useState<WorkspaceLite | null>(null);

  const workspaceLimit = WORKSPACE_LIMIT[planTier];
  const ownedCount = workspaces.filter((w) => w.ownerId === currentUserId).length;
  const canCreateWorkspace =
    (planTier === "studio" || planTier === "agency") &&
    (workspaceLimit === null || ownedCount < workspaceLimit);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const primaryWorkspaceId =
    workspaces.find((w) => w.role === "owner")?.id ?? workspaces[0]?.id ?? null;

  const workspaceIds = useMemo(() => new Set(workspaces.map((w) => w.id)), [workspaces]);

  // Split projects into: grouped by known workspace, and "shared with me" (foreign workspace).
  const { grouped, sharedWithMe } = useMemo(() => {
    const byWs = new Map<string, Project[]>();
    for (const ws of workspaces) byWs.set(ws.id, []);
    const shared: Project[] = [];

    for (const p of projects) {
      const wsId = p.workspaceId || primaryWorkspaceId;
      if (wsId && workspaceIds.has(wsId)) {
        byWs.get(wsId)!.push(p);
      } else if (p.ownerId === currentUserId && primaryWorkspaceId) {
        // Owner without a workspace fallback — put in primary.
        byWs.get(primaryWorkspaceId)!.push(p);
      } else {
        shared.push(p);
      }
    }

    return { grouped: byWs, sharedWithMe: shared };
  }, [projects, workspaces, primaryWorkspaceId, workspaceIds, currentUserId]);

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) ?? null
    : null;

  // Flat list when the user only has one workspace AND can't create more.
  const flatMode = workspaces.length <= 1 && !canCreateWorkspace && sharedWithMe.length === 0;

  function showError(msg: string) {
    setToastError(msg);
    setTimeout(() => setToastError(null), 3500);
  }

  async function moveProject(projectId: string, targetWorkspaceId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if ((project.workspaceId || primaryWorkspaceId) === targetWorkspaceId) return;
    if (project.ownerId !== currentUserId) {
      showError("Seul le propriétaire peut déplacer un projet.");
      return;
    }

    const prevWorkspaceId = project.workspaceId ?? null;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, workspaceId: targetWorkspaceId } : p))
    );

    try {
      const res = await authedFetch(`/api/projects/${projectId}/workspace`, {
        method: "PATCH",
        body: JSON.stringify({ workspaceId: targetWorkspaceId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur");
    } catch (err) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, workspaceId: prevWorkspaceId } : p))
      );
      showError(err instanceof Error ? err.message : "Impossible de déplacer le projet.");
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

  async function createWorkspace() {
    const name = newWsName.trim();
    if (!name || creatingWs) return;
    setCreatingWs(true);
    try {
      const res = await authedFetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const ws = (await res.json()) as WorkspaceLite;
      setWorkspaces((prev) => [...prev, ws]);
      setNewWsName("");
      setShowCreateWs(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Impossible de créer le workspace.");
    } finally {
      setCreatingWs(false);
    }
  }

  async function renameWorkspace(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const prev = workspaces.find((w) => w.id === id)?.name ?? trimmed;
    setWorkspaces((list) => list.map((w) => (w.id === id ? { ...w, name: trimmed } : w)));
    try {
      const res = await authedFetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur");
    } catch (err) {
      setWorkspaces((list) => list.map((w) => (w.id === id ? { ...w, name: prev } : w)));
      showError(err instanceof Error ? err.message : "Impossible de renommer.");
    }
  }

  async function deleteWorkspace(id: string) {
    if (!confirm("Supprimer ce workspace ? Il doit être vide.")) return;
    const prev = workspaces;
    setWorkspaces((list) => list.filter((w) => w.id !== id));
    try {
      const res = await authedFetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur");
    } catch (err) {
      setWorkspaces(prev);
      showError(err instanceof Error ? err.message : "Impossible de supprimer.");
    }
  }

  if (flatMode) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <p className="text-2xs uppercase tracking-widest font-medium" style={{ color: "var(--text-faint)" }}>
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
            <p className="text-2xs uppercase tracking-widest font-medium mb-3" style={{ color: "var(--text-faint)" }}>
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
      <div className="flex items-center justify-between mb-4 gap-2">
        {canCreateWorkspace ? (
          showCreateWs ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createWorkspace();
              }}
              className="flex items-center gap-2 flex-1 max-w-[320px]"
            >
              <input
                autoFocus
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                onBlur={() => {
                  if (!newWsName.trim()) setShowCreateWs(false);
                }}
                placeholder="Nom du workspace"
                maxLength={60}
                className="flex-1 h-8 px-3 rounded-md text-2xs focus:outline-none"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--line-strong)",
                }}
              />
              <button
                type="submit"
                disabled={!newWsName.trim() || creatingWs}
                className="h-8 px-3 rounded-md text-2xs font-medium transition-all disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {creatingWs ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateWs(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-2xs font-medium transition-all hover:brightness-110"
              style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--line)" }}
            >
              <Plus className="w-3 h-3" />
              Nouveau workspace
            </button>
          )
        ) : (
          <span />
        )}
        <NewProjectButton variant="small" />
      </div>

      {toastError && (
        <div
          className="mb-4 px-3 py-2 rounded-md text-2xs"
          style={{
            background: "var(--error-glow)",
            border: "1px solid var(--error-border)",
            color: "var(--error-text)",
          }}
        >
          {toastError}
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
            onRename={(name) => renameWorkspace(ws.id, name)}
            onDelete={() => deleteWorkspace(ws.id)}
            onInvite={() => setInviteModalFor(ws)}
          />
        ))}

        {sharedWithMe.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <p
                className="text-2xs uppercase tracking-widest font-medium"
                style={{ color: "var(--text-faint)" }}
              >
                Partagés avec moi
              </p>
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
              >
                {sharedWithMe.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {sharedWithMe.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {demo && (
        <div className="mt-8">
          <p className="text-2xs uppercase tracking-widest font-medium mb-3" style={{ color: "var(--text-faint)" }}>
            Exemple
          </p>
          <ProjectCard project={demo} index={projects.length} />
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {activeProject ? <ProjectCardPreview project={activeProject} /> : null}
      </DragOverlay>

      {inviteModalFor && (
        <InviteModal workspace={inviteModalFor} onClose={() => setInviteModalFor(null)} />
      )}
    </DndContext>
  );
}

function WorkspaceSection({
  workspace,
  projects,
  currentUserId,
  isDragging,
  onRename,
  onDelete,
  onInvite,
}: {
  workspace: WorkspaceLite;
  projects: Project[];
  currentUserId: string;
  isDragging: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onInvite: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: workspace.id });
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(workspace.name);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setNameDraft(workspace.name);
  }, [workspace.name]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const isOwner = workspace.role === "owner";
  const canManage = workspace.role === "owner" || workspace.role === "admin";
  const roleLabel = workspace.role === "owner" ? "Owner" : workspace.role === "admin" ? "Admin" : "Membre";

  function commitRename() {
    const t = nameDraft.trim();
    if (t && t !== workspace.name) onRename(t);
    setRenaming(false);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setNameDraft(workspace.name);
                  setRenaming(false);
                }
              }}
              maxLength={60}
              className="text-2xs uppercase tracking-widest font-medium bg-transparent focus:outline-none"
              style={{
                color: "var(--text-primary)",
                borderBottom: "1px solid var(--accent)",
              }}
            />
          ) : (
            <p
              className="text-2xs uppercase tracking-widest font-medium truncate"
              style={{ color: "var(--text-faint)" }}
            >
              {workspace.name}
            </p>
          )}
          {workspace.role !== "owner" && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
            >
              {roleLabel}
            </span>
          )}
        </div>

        {canManage && !renaming && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text-faint)" }}
              aria-label="Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 w-44 rounded-md overflow-hidden z-10 shadow-lg"
                style={{ background: "var(--elevated)", border: "1px solid var(--line)" }}
              >
                <MenuItem
                  icon={<Pencil className="w-3 h-3" />}
                  label="Renommer"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                />
                <MenuItem
                  icon={<UserPlus className="w-3 h-3" />}
                  label="Inviter un membre"
                  onClick={() => {
                    setMenuOpen(false);
                    onInvite();
                  }}
                />
                {isOwner && (
                  <MenuItem
                    icon={<Trash2 className="w-3 h-3" />}
                    label="Supprimer"
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
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
          <p className="text-2xs text-center py-3" style={{ color: "var(--text-faint)" }}>
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

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-left transition-colors hover:bg-[var(--surface-hover)]"
      style={{ color: danger ? "var(--error-text)" : "var(--text-secondary)" }}
    >
      {icon}
      {label}
    </button>
  );
}

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "editor";
  userName?: string;
  userEmail?: string;
  joinedAt: number | null;
}

function InviteModal({ workspace, onClose }: { workspace: WorkspaceLite; onClose: () => void }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`);
        if (res.ok) setMembers(await res.json());
      } catch {
        /* ignore */
      }
    })();
  }, [workspace.id]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || inviting) return;
    setInviting(true);
    setMessage(null);
    try {
      const res = await authedFetch(`/api/workspaces/${workspace.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEmail("");
      setMessage({ type: "ok", text: "Invitation envoyée." });
      // Refresh members
      const mr = await fetch(`/api/workspaces/${workspace.id}/members`);
      if (mr.ok) setMembers(await mr.json());
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {workspace.name}
            </p>
            <p className="text-2xs" style={{ color: "var(--text-faint)" }}>
              Inviter un membre
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-faint)" }}
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <form onSubmit={invite} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3"
                style={{ color: "var(--text-faint)" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (message) setMessage(null);
                }}
                placeholder="email@exemple.com"
                className="w-full h-9 pl-8 pr-3 rounded-md text-2xs focus:outline-none"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--line-strong)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!email.trim() || inviting}
              className="h-9 px-3 rounded-md text-2xs font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Inviter"}
            </button>
          </form>

          {message && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-2xs"
              style={{
                background: message.type === "ok" ? "var(--success-bg)" : "var(--error-glow)",
                color: message.type === "ok" ? "var(--success-text)" : "var(--error-text)",
              }}
            >
              {message.type === "ok" ? <Check className="w-3 h-3" /> : null}
              {message.text}
            </div>
          )}

          <div>
            <p
              className="text-2xs uppercase tracking-widest font-medium mb-2"
              style={{ color: "var(--text-faint)" }}
            >
              Membres
            </p>
            {members === null ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-faint)" }} />
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md"
                    style={{ background: "var(--elevated)" }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-2xs font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {m.userName || m.userEmail || "—"}
                      </p>
                      {m.userEmail && m.userName && (
                        <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>
                          {m.userEmail}
                        </p>
                      )}
                    </div>
                    <span className="flex items-center gap-2 shrink-0">
                      {!m.joinedAt && (
                        <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
                          En attente
                        </span>
                      )}
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                      >
                        {m.role}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
