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

  // Check if user is a project member (owner/editor) — if not, read-only
  let readOnly = !currentUser;
  if (currentUser) {
    const member = db
      .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
      .get(project.id, currentUser.id) as { role: string } | undefined;
    readOnly = !member || member.role === "viewer";
  }

  // Strip password before sending to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeProject } = project;

  return <CanvasPage project={safeProject as Project} currentUser={currentUser} readOnly={readOnly} />;
}

export async function generateMetadata({ params }: Props) {
  const project = getProject(params.project);
  if (!project) return { title: "arbo — Projet introuvable" };
  return {
    title: `${project.name} — arbo`,
    description: `Arborescence ${project.name} · ${project.client}`,
  };
}
