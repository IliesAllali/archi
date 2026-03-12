import { redirect } from "next/navigation";
import { getAllProjects } from "@/lib/project-loader";

export default function HomePage() {
  const projects = getAllProjects();

  // MVP: redirect to first project, no dashboard yet
  if (projects.length > 0) {
    redirect(`/${projects[0].id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-lg bg-bg-surface border border-line flex items-center justify-center mx-auto mb-4">
          <span className="text-sm font-semibold text-label-primary">a</span>
        </div>
        <p className="text-sm text-label-muted">
          Aucun projet. Ajoutez un fichier JSON dans <code className="font-mono text-2xs text-label-secondary">/data/projects/</code>
        </p>
      </div>
    </div>
  );
}
