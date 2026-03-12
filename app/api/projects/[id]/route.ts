import { NextRequest, NextResponse } from "next/server"
import { getProject, saveProject, deleteProject } from "@/lib/project-loader"

function checkApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${process.env.API_KEY}`
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const updated = { ...project, ...body, id: params.id }
  saveProject(updated)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkApiKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ok = deleteProject(params.id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
