import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; tokenId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { getProjectRole } = await import("@/lib/project-access")
  const role = getProjectRole(params.id, session.sub)
  if (!role || role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Revoke (soft delete) rather than hard delete
  const result = db
    .prepare("UPDATE ai_tokens SET revoked_at = ? WHERE id = ? AND project_id = ? AND revoked_at IS NULL")
    .run(Date.now(), params.tokenId, params.id)

  if (result.changes === 0) {
    return NextResponse.json({ error: "Token not found or already revoked" }, { status: 404 })
  }

  return NextResponse.json({ revoked: true })
}
