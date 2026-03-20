import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(_req: Request, { params }: { params: Promise<{ keyId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { keyId } = await params
  db.prepare("DELETE FROM user_api_keys WHERE id = ? AND user_id = ?").run(keyId, session.sub)

  return NextResponse.json({ ok: true })
}
