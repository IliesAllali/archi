import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  // Allow both authenticated users and guests (guests can resolve/edit via share links)
  const body = await req.json()

  if (body.resolved !== undefined) {
    db.prepare("UPDATE comments SET resolved = ? WHERE id = ? AND project_id = ?")
      .run(body.resolved ? 1 : 0, params.commentId, params.id)
  }

  if (typeof body.offsetX === "number" && typeof body.offsetY === "number") {
    db.prepare("UPDATE comments SET offset_x = ?, offset_y = ? WHERE id = ? AND project_id = ?")
      .run(body.offsetX, body.offsetY, params.commentId, params.id)
  }

  if (typeof body.content === "string") {
    db.prepare("UPDATE comments SET content = ? WHERE id = ? AND project_id = ?")
      .run(body.content.trim(), params.commentId, params.id)
  }

  if (body.tag !== undefined) {
    db.prepare("UPDATE comments SET tag = ? WHERE id = ? AND project_id = ?")
      .run(body.tag, params.commentId, params.id)
  }

  if (body.section !== undefined) {
    db.prepare("UPDATE comments SET section = ? WHERE id = ? AND project_id = ?")
      .run(body.section, params.commentId, params.id)
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
