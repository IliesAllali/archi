import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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

  // No password required — hand off to the route handler, which sets the guest cookie and
  // redirects to the project. (Cookies cannot be written during a Server Component render.)
  if (!link.password_hash) {
    redirect(`/api/share/${params.token}`);
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
