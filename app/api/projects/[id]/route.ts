import { NextRequest, NextResponse } from "next/server"
import { getProject, saveProject, deleteProject } from "@/lib/project-loader"
import { requireProjectRead, requireProjectWrite } from "@/lib/project-access"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireProjectRead(req, params.id)
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireProjectWrite(req, params.id)
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = { ...project, ...body, id: params.id }
  saveProject(updated)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireProjectWrite(req, params.id)
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ok = deleteProject(params.id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
