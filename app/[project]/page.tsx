import { getProject } from "@/lib/project-loader";
import { notFound } from "next/navigation";
import CanvasPage from "./CanvasPage";

interface Props {
  params: { project: string };
}

export default function ProjectPage({ params }: Props) {
  const project = getProject(params.project);
  if (!project) notFound();
  return <CanvasPage project={project} />;
}

export async function generateMetadata({ params }: Props) {
  const project = getProject(params.project);
  if (!project) return { title: "arbo — Projet introuvable" };
  return {
    title: `${project.name} — arbo`,
    description: `Arborescence ${project.name} · ${project.client}`,
  };
}
