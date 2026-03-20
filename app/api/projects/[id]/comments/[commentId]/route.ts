import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  if (body.resolved !== undefined) {
    db.prepare("UPDATE comments SET resolved = ? WHERE id = ? AND project_id = ?")
      .run(body.resolved ? 1 : 0, params.commentId, params.id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  db.prepare("DELETE FROM comments WHERE id = ? AND project_id = ?")
    .run(params.commentId, params.id)

  return NextResponse.json({ ok: true })
}
