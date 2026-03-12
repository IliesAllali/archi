import { getProject } from "@/lib/project-loader";
import { notFound } from "next/navigation";
import CanvasPage from "./CanvasPage";
import type { Project } from "@/lib/types";

interface Props {
  params: { project: string };
}

export default function ProjectPage({ params }: Props) {
  const project = getProject(params.project);
  if (!project) notFound();

  // Strip password before sending to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeProject } = project;

  return <CanvasPage project={safeProject as Project} />;
}

export async function generateMetadata({ params }: Props) {
  const project = getProject(params.project);
  if (!project) return { title: "arbo — Projet introuvable" };
  return {
    title: `${project.name} — arbo`,
    description: `Arborescence ${project.name} · ${project.client}`,
  };
}
