import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME, CSRF_COOKIE } from "@/lib/auth";
import { nanoid } from "nanoid";
import { getProject, getAllProjects } from "@/lib/project-loader";
import fs from "fs";
import path from "path";

/**
 * Legacy auth route — simple password-based login.
 * Checks admin password and per-project passwords from JSON files.
 * Will be replaced by the multi-user auth system (POST /api/auth/login).
 */

interface JsonProject {
  id: string;
  password?: string;
}

function getJsonProjectPasswords(): JsonProject[] {
  try {
    const dir = path.join(process.cwd(), "data", "projects");
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      return { id: data.id, password: data.password };
    });
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { password: rawPassword, project: projectId } = await req.json();
  const password = (rawPassword || "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 401 });
  }

  // Check admin password
  if (adminPassword && password === adminPassword) {
    const token = await createSession({ role: "admin" });
    const csrfToken = nanoid(32);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  // Read project passwords from JSON files (legacy — not in SQLite)
  const jsonProjects = getJsonProjectPasswords();

  // Check per-project password
  if (projectId) {
    const jsonProject = jsonProjects.find((p) => p.id === projectId);
    if (jsonProject?.password && password === jsonProject.password) {
      const token = await createSession({ role: "viewer", project: projectId });
      const res = NextResponse.json({ ok: true });
      res.cookies.set(`arbo_project_${projectId}`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return res;
    }
  }

  // No project specified — try matching password against all projects
  if (!projectId) {
    const matched = jsonProjects.find((p) => p.password && password === p.password);
    if (matched) {
      const token = await createSession({ role: "viewer", project: matched.id });
      const res = NextResponse.json({ ok: true, project: matched.id });
      res.cookies.set(`arbo_project_${matched.id}`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return res;
    }
  }

  return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
}
