import { getAllProjects } from "@/lib/project-loader";
import Logo from "@/components/Logo";
import ProjectCard from "@/components/ProjectCard";

export default function HomePage() {
  const projects = getAllProjects();

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
      {/* Top bar */}
      <header
        className="px-5 h-11 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center">
            <Logo size={14} />
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            arbo
          </span>
        </div>
        <span className="text-2xs font-mono" style={{ color: "var(--text-faint)" }}>
          {projects.length} projet{projects.length !== 1 ? "s" : ""}
        </span>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {projects.length === 0 ? (
          <div className="text-center py-24 animate-fade-in-up">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              <Logo size={16} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucun projet</p>
            <p className="text-2xs mt-1" style={{ color: "var(--text-faint)" }}>
              Ajoutez un fichier JSON dans{" "}
              <code
                className="font-mono px-1 py-0.5 rounded"
                style={{ color: "var(--text-secondary)", background: "var(--surface)" }}
              >
                /data/projects/
              </code>
            </p>
          </div>
        ) : (
          <div>
            <p
              className="text-2xs uppercase tracking-widest mb-4 font-medium animate-fade-in"
              style={{ color: "var(--text-faint)" }}
            >
              Projets récents
            </p>
            <div className="space-y-1.5">
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
