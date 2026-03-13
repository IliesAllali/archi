import Link from "next/link";
import { getAllProjects } from "@/lib/project-loader";
import type { Project } from "@/lib/types";
import Logo from "@/components/Logo";

export default function HomePage() {
  const projects = getAllProjects();

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Top bar */}
      <header className="border-b border-line px-5 h-11 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center">
            <Logo size={14} />
          </div>
          <span className="text-sm font-semibold text-label-primary tracking-tight">arbo</span>
        </div>
        <span className="text-2xs text-label-faint font-mono">
          {projects.length} projet{projects.length !== 1 ? "s" : ""}
        </span>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-10 h-10 rounded-xl bg-bg-surface border border-line flex items-center justify-center mx-auto mb-4">
              <Logo size={16} />
            </div>
            <p className="text-sm text-label-muted">Aucun projet</p>
            <p className="text-2xs text-label-faint mt-1">
              Ajoutez un fichier JSON dans{" "}
              <code className="font-mono text-label-secondary bg-bg-surface px-1 py-0.5 rounded">
                /data/projects/
              </code>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-2xs text-label-faint uppercase tracking-widest mb-4 font-medium">
              Projets récents
            </p>
            <div className="space-y-1.5">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/${project.id}`} className="group block">
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-line bg-bg-surface hover:bg-bg-hover hover:border-line-strong transition-all duration-100">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: project.accent }}
          />
          <div className="min-w-0">
            <span className="text-sm font-medium text-label-secondary group-hover:text-label-primary transition-colors duration-100 block truncate">
              {project.name}
            </span>
            <span className="text-2xs text-label-faint">{project.client}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span
            className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded"
            style={{ color: project.accent, backgroundColor: `${project.accent}18` }}
          >
            {project.version}
          </span>
          <span className="text-2xs text-label-faint hidden sm:block">{formattedDate}</span>
          <span className="text-2xs text-label-faint font-mono">{project.nodes.length}p</span>
          <span className="text-label-faint text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
