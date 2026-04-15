import { getProject } from "@/lib/project-loader";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CanvasPage from "./CanvasPage";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { project: string };
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject(params.project);
  if (!project) notFound();

  const session = await getSession();
  let currentUser: { id: string; name: string; role: string; avatar?: string | null } | null = null;
  if (session) {
    const dbUser = db.prepare("SELECT avatar FROM users WHERE id = ?").get(session.sub) as { avatar: string | null } | undefined;
    currentUser = { id: session.sub, name: session.name, role: session.role, avatar: dbUser?.avatar || null };
  }

  // Check if user is a project member (direct or via workspace) — if not, read-only
  let readOnly = !currentUser;
  if (currentUser) {
    // Direct project membership
    const projectMember = db
      .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
      .get(project.id, currentUser.id) as { role: string } | undefined;

    // Workspace membership (if project belongs to a workspace)
    const workspaceMember = !projectMember ? db.prepare(`
      SELECT wm.role FROM workspace_members wm
      JOIN projects p ON p.workspace_id = wm.workspace_id
      WHERE p.id = ? AND wm.user_id = ? AND wm.joined_at IS NOT NULL
    `).get(project.id, currentUser.id) as { role: string } | undefined : undefined;

    const member = projectMember || workspaceMember;
    readOnly = !member || member.role === "viewer";
  }

  // Get owner plan tier + branding for watermark/white label on shared views
  const owner = db.prepare("SELECT plan_tier FROM users WHERE id = ?")
    .get(project.ownerId) as { plan_tier: string } | undefined;
  const ownerPlanTier = owner?.plan_tier || "free";

  // Get workspace branding if white label is available
  let ownerBranding: { logoUrl?: string | null; companyName?: string | null } | null = null;
  if (["studio", "agency"].includes(ownerPlanTier)) {
    const ws = db.prepare("SELECT id FROM workspaces WHERE owner_id = ? LIMIT 1")
      .get(project.ownerId) as { id: string } | undefined;
    if (ws) {
      const b = db.prepare("SELECT logo_url, company_name FROM workspace_branding WHERE workspace_id = ?")
        .get(ws.id) as { logo_url: string | null; company_name: string | null } | undefined;
      if (b && (b.logo_url || b.company_name)) {
        ownerBranding = { logoUrl: b.logo_url, companyName: b.company_name };
      }
    }
  }

  // Strip password before sending to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeProject } = project;

  return <CanvasPage project={safeProject as Project} currentUser={currentUser} readOnly={readOnly} ownerPlanTier={ownerPlanTier} ownerBranding={ownerBranding} />;
}

export async function generateMetadata({ params }: Props) {
  const project = getProject(params.project);
  if (!project) return { title: "arbo — Projet introuvable" };
  return {
    title: `${project.name} — arbo`,
    description: `Arborescence ${project.name} · ${project.client}`,
  };
}
