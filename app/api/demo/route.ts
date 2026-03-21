import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

const DEMO_SLUG = "demo-ecommerce"

export async function GET() {
  const demo = db.prepare("SELECT id FROM projects WHERE slug = ?").get(DEMO_SLUG) as { id: string } | undefined
  return NextResponse.json({ exists: !!demo })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const demo = db.prepare("SELECT id FROM projects WHERE slug = ?").get(DEMO_SLUG) as { id: string } | undefined
  if (!demo) {
    return NextResponse.json({ error: "Pas de projet exemple" }, { status: 404 })
  }

  db.transaction(() => {
    db.prepare("DELETE FROM nodes WHERE project_id = ?").run(demo.id)
    db.prepare("DELETE FROM project_members WHERE project_id = ?").run(demo.id)
    db.prepare("DELETE FROM version_snapshots WHERE project_id = ?").run(demo.id)
    db.prepare("DELETE FROM projects WHERE id = ?").run(demo.id)
  })()

  revalidatePath("/")
  return NextResponse.json({ success: true })
}
