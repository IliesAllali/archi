import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession, COOKIE_NAME } from "@/lib/auth";
import Logo from "@/components/Logo";
import SharePasswordForm from "./SharePasswordForm";

export const dynamic = "force-dynamic";

interface ShareRow {
  id: string;
  project_id: string;
  password_hash: string | null;
  permissions: string;
  expires_at: number | null;
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const link = db
    .prepare(
      "SELECT id, project_id, password_hash, permissions, expires_at FROM project_share_links WHERE token = ?"
    )
    .get(params.token) as ShareRow | undefined;

  if (!link) {
    return <ShareError message="Lien invalide ou expiré" />;
  }

  if (link.expires_at && link.expires_at < Date.now()) {
    return <ShareError message="Ce lien a expiré" />;
  }

  // No password required — create guest session, set cookie, redirect straight to the project.
  if (!link.password_hash) {
    db.prepare("UPDATE project_share_links SET visit_count = visit_count + 1 WHERE id = ?").run(link.id);

    const sessionToken = await createSession({
      role: "viewer",
      project: link.project_id,
    });

    cookies().set(COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(`/${link.project_id}`);
  }

  // Password required — render the form (client component).
  return <SharePasswordForm projectId={link.project_id} token={params.token} />;
}

function ShareError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--card-title-bg)", border: "1px solid var(--card-ring)" }}
          >
            <Logo size={22} />
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--error-text)" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
