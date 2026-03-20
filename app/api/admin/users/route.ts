import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

interface UserRow {
  id: string
  email: string
  email_verified: number
  name: string
  color: string
  role_global: string
  created_at: number
  updated_at: number
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = db
    .prepare("SELECT id, email, email_verified, name, color, role_global, created_at, updated_at FROM users ORDER BY created_at DESC")
    .all() as UserRow[]

  // Enrich with project count
  const projectCounts = db
    .prepare("SELECT owner_id, COUNT(*) as c FROM projects WHERE archived = 0 GROUP BY owner_id")
    .all() as { owner_id: string; c: number }[]
  const countMap = new Map(projectCounts.map(r => [r.owner_id, r.c]))

  return NextResponse.json(
    users.map(u => ({
      id: u.id,
      email: u.email,
      emailVerified: !!u.email_verified,
      name: u.name,
      color: u.color,
      role: u.role_global,
      projectCount: countMap.get(u.id) || 0,
      createdAt: u.created_at,
    }))
  )
}
