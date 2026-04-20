import { getDemoProject, getProjectsForUser } from "@/lib/project-loader";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS, type PlanTier } from "@/lib/plans";
import { getWorkspacesForUser } from "@/lib/workspace";
import Logo from "@/components/Logo";
import ProjectCard from "@/components/ProjectCard";
import ThemeToggle from "@/components/ThemeToggle";
import NewProjectButton from "@/components/NewProjectButton";
import UserMenu from "@/components/UserMenu";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const demo = getDemoProject();

  const allProjects = session ? getProjectsForUser(session.sub) : [];
  const projects = allProjects.filter((p) => (demo ? p.id !== demo.id : true));

  const workspaces = session ? getWorkspacesForUser(session.sub) : [];

  let planTier: PlanTier = "free";
  let maxProjects: number | null = 3;
  if (session) {
    const user = db.prepare("SELECT plan_tier FROM users WHERE id = ?")
      .get(session.sub) as { plan_tier: string } | undefined;
    planTier = (user?.plan_tier || "free") as PlanTier;
    maxProjects = PLAN_LIMITS[planTier]?.maxProjects ?? 3;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
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
            {projects.length}{maxProjects ? `/${maxProjects}` : ""} projet{projects.length !== 1 ? "s" : ""}
          </span>
          {planTier !== "free" && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded hidden sm:inline"
              style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
            >
              {PLAN_LIMITS[planTier]?.label}
            </span>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {projects.length === 0 ? (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center py-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5 animate-float"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <Logo size={20} />
              </div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
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
          <HomeClient
            workspaces={workspaces}
            projects={projects}
            demo={demo}
            currentUserId={session?.sub || ""}
          />
        )}
      </main>
    </div>
  );
}
