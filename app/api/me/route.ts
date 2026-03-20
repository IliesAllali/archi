import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = db.prepare("SELECT id, name, email, color, role_global FROM users WHERE id = ?").get(session.sub) as any
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    color: user.color,
    role: user.role_global,
  })
}
