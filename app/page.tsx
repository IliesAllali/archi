import { getAllProjects, getDemoProject } from "@/lib/project-loader";
import Logo from "@/components/Logo";
import ProjectCard from "@/components/ProjectCard";
import ThemeToggle from "@/components/ThemeToggle";
import NewProjectButton from "@/components/NewProjectButton";
import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const projects = getAllProjects();
  const demo = getDemoProject();

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
      {/* Top bar */}
      <header
        className="px-3 sm:px-5 h-11 flex items-center justify-between"
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
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xs font-mono hidden sm:inline" style={{ color: "var(--text-faint)" }}>
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </span>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {projects.length === 0 ? (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center py-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <Logo size={20} />
              </div>
              <h2
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Bienvenue sur arbo
              </h2>
              <p className="text-2xs mb-6" style={{ color: "var(--text-muted)" }}>
                Créez votre première arborescence de site pour commencer.
              </p>
              <NewProjectButton variant="large" />
            </div>

            {demo && (
              <div>
                <p
                  className="text-2xs uppercase tracking-widest font-medium mb-3"
                  style={{ color: "var(--text-faint)" }}
                >
                  Exemple
                </p>
                <ProjectCard project={demo} index={0} />
              </div>
            )}
          </div>
        ) : (
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
          </div>
        )}
      </main>
    </div>
  );
}
