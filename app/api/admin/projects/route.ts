import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = db.prepare(`
    SELECT
      p.id, p.slug, p.name, p.client, p.accent, p.version,
      p.owner_id, p.created_at, p.updated_at,
      u.name as owner_name, u.email as owner_email,
      (SELECT COUNT(*) FROM nodes n WHERE n.project_id = p.id AND n.archived = 0) as node_count
    FROM projects p
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE p.archived = 0
    ORDER BY p.updated_at DESC
  `).all()

  return NextResponse.json({ data: rows })
}
