"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Bot,
  Activity,
  ArrowLeft,
  Share2,
  GitBranch,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalNodes: number;
  activeUsers30d: number;
  projectsCreated7d: number;
  aiActions7d: number;
  activeTokens: number;
  shareLinks: number;
}

interface UserRow {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  color: string;
  role: string;
  projectCount: number;
  createdAt: number;
}

interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  client: string | null;
  version: string;
  owner_name: string | null;
  owner_email: string | null;
  node_count: number;
  created_at: number;
  updated_at: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

export default function AdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csrfToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("arbo_csrf="))
      ?.split("=")[1];
    const h = { "x-csrf-token": csrfToken || "" };

    Promise.all([
      fetch("/api/admin/stats", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/users", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/projects", { headers: h }).then((r) => r.json()),
    ])
      .then(([s, u, p]) => {
        setStats(s);
        setUsers(Array.isArray(u) ? u : []);
        setProjects(Array.isArray(p?.data) ? p.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <div className="animate-pulse text-sm" style={{ color: "var(--text-muted)" }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="p-2 rounded-md hover:bg-bg-hover transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Administration
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Vue globale de l'instance Arbo
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="#F76B15" />
            <StatCard icon={FolderKanban} label="Projets" value={stats.totalProjects} color="#8B5CF6" />
            <StatCard icon={GitBranch} label="Pages" value={stats.totalNodes} color="#10B981" />
            <StatCard icon={Activity} label="Actifs (30j)" value={stats.activeUsers30d} color="#F59E0B" />
            <StatCard icon={BarChart3} label="Projets (7j)" value={stats.projectsCreated7d} color="#EC4899" />
            <StatCard icon={Bot} label="Actions IA (7j)" value={stats.aiActions7d} color="#06B6D4" />
            <StatCard icon={Bot} label="Tokens actifs" value={stats.activeTokens} color="#EF4444" />
            <StatCard icon={Share2} label="Liens partage" value={stats.shareLinks} color="#8B5CF6" />
          </div>
        )}

        {/* Users Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Utilisateurs ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Nom</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Email</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Role</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Projets</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Inscrit</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>
                      {user.email}
                      {!user.emailVerified && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700">
                          non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: user.role === "admin" ? "#EF444420" : "#F76B1520",
                          color: user.role === "admin" ? "#EF4444" : "#F76B15",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {user.projectCount}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: "var(--text-faint)" }}>
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Projects Table */}
        <div
          className="rounded-xl overflow-hidden mt-6"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Tous les projets ({projects.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Projet</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Owner</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Pages</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Version</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Modifié</th>
                  <th className="text-center px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Lien</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-2.5">
                      <div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {p.name}
                        </span>
                        {p.client && (
                          <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}>
                            {p.client}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>
                      {p.owner_name || p.owner_email || "system"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {p.node_count}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: "var(--text-faint)" }}>
                      {p.version}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: "var(--text-faint)" }}>
                      {new Date(p.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Link
                        href={`/${p.slug}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors hover:brightness-110"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
