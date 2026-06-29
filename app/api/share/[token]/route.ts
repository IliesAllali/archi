import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ShareRow {
  id: string;
  project_id: string;
  password_hash: string | null;
  permissions: string;
  expires_at: number | null;
}

/**
 * GET /api/share/[token]
 * Entry point for a no-password share link. Sets the per-project guest cookie and redirects to the
 * project. Cookie writes are only allowed in a Route Handler (not in a Server Component render),
 * so the /share/[token] page redirects here instead of setting the cookie itself.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const link = db
    .prepare(
      "SELECT id, project_id, password_hash, permissions, expires_at FROM project_share_links WHERE token = ?"
    )
    .get(params.token) as ShareRow | undefined;

  // Invalid, expired, or password-protected -> bounce back to the page (it renders the right UI/form)
  // Use a relative Location so the browser resolves it on the public host (req.url is the internal
  // 0.0.0.0:3002 address behind the proxy).
  if (!link || (link.expires_at && link.expires_at < Date.now()) || link.password_hash) {
    return new NextResponse(null, { status: 307, headers: { Location: `/share/${params.token}` } });
  }

  db.prepare("UPDATE project_share_links SET visit_count = visit_count + 1 WHERE id = ?").run(link.id);

  const sessionToken = await createSession({ role: "viewer", project: link.project_id });

  const res = new NextResponse(null, { status: 307, headers: { Location: `/${link.project_id}` } });
  res.cookies.set(`arbo_project_${link.project_id}`, sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
