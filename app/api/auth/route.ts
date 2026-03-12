import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth";
import { getProject } from "@/lib/project-loader";

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
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  // Check per-project password
  if (projectId) {
    const project = getProject(projectId);
    if (project?.password && password === project.password) {
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

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
