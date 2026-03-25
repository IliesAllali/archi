import { NextRequest, NextResponse } from "next/server"
import { getAllProjects } from "@/lib/project-loader"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import type { Project } from "@/lib/types"
import type { DbProject } from "@/lib/db"

export const dynamic = "force-dynamic"

function checkApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const key = process.env.API_KEY
  return auth === `Bearer ${key}`
}

export async function GET(req: NextRequest) {
  // API key → all projects (backwards compat)
  if (checkApiKey(req)) {
    const projects = getAllProjects()
    return NextResponse.json(projects)
  }

  // Session → only user's projects
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projects = getAllProjects()
  const memberProjectIds = new Set(
    (db.prepare("SELECT project_id FROM project_members WHERE user_id = ?").all(session.sub) as { project_id: string }[])
      .map(r => r.project_id)
  )

  const filtered = projects.filter(
    p => p.ownerId === session.sub || memberProjectIds.has(p.id)
  )
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  // Support both API key auth (external) and session auth (dashboard)
  const hasApiKey = checkApiKey(req)
  const session = await getSession()

  if (!hasApiKey && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as Partial<Project> & { name?: string }
  const name = body.name || "Nouveau projet"

  const projectId = nanoid()
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6)}`
  const now = Date.now()
  const ownerId = session?.sub || "system"

  // Create the project
  db.prepare(
    `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    projectId,
    slug,
    name,
    body.client || null,
    body.accent || "#F76B15",
    body.version || "v1",
    ownerId,
    now,
    now
  )

  // Add owner as project member
  if (session) {
    db.prepare(
      "INSERT INTO project_members (project_id, user_id, role, added_at) VALUES (?, ?, ?, ?)"
    ).run(projectId, session.sub, "owner", now)
  }

  // Create a default root node
  const rootNodeId = nanoid()
  const rootData = JSON.stringify({
    label: "Accueil",
    type: "home",
    priority: "primary",
    description: "",
  })

  db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, NULL, 0, 0, ?, ?, ?)`
  ).run(rootNodeId, projectId, rootData, now, now)

  return NextResponse.json({
    id: projectId,
    slug,
    name,
    client: body.client || "",
    version: body.version || "v1",
    accent: body.accent || "#F76B15",
  }, { status: 201 })
}
