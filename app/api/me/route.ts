import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { sanitizeText } from "@/lib/sanitize"
import bcryptjs from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = db.prepare("SELECT id, name, email, color, avatar, role_global FROM users WHERE id = ?").get(session.sub) as any
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    color: user.color,
    avatar: user.avatar || null,
    role: user.role_global,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const updates: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    const name = sanitizeText(body.name)?.trim()
    if (!name || name.length < 1 || name.length > 50) {
      return NextResponse.json({ error: "Nom invalide (1-50 caractères)" }, { status: 400 })
    }
    updates.push("name = ?")
    values.push(name)
  }

  if (body.color !== undefined) {
    const color = String(body.color).trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "Couleur invalide (format #RRGGBB)" }, { status: 400 })
    }
    updates.push("color = ?")
    values.push(color)
  }

  if (body.avatar !== undefined) {
    if (body.avatar === null) {
      updates.push("avatar = ?")
      values.push(null)
    } else if (typeof body.avatar === "string" && body.avatar.startsWith("data:image/")) {
      // Max ~500KB base64 (~375KB image)
      if (body.avatar.length > 500_000) {
        return NextResponse.json({ error: "Image trop lourde (max 500KB)" }, { status: 400 })
      }
      updates.push("avatar = ?")
      values.push(body.avatar)
    } else {
      return NextResponse.json({ error: "Format d'image invalide" }, { status: 400 })
    }
  }

  if (body.newPassword !== undefined) {
    const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.sub) as { password_hash: string } | undefined
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (!body.currentPassword || !bcryptjs.compareSync(body.currentPassword, user.password_hash)) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
    }
    if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
      return NextResponse.json({ error: "Nouveau mot de passe trop court (8 caractères min)" }, { status: 400 })
    }
    const hash = bcryptjs.hashSync(body.newPassword, 12)
    updates.push("password_hash = ?")
    values.push(hash)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 })
  }

  updates.push("updated_at = ?")
  values.push(Date.now())
  values.push(session.sub)

  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values)

  return NextResponse.json({ success: true })
}
