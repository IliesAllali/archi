import { NextRequest, NextResponse } from "next/server"
import { getProject, saveProject } from "@/lib/project-loader"

function checkApiKey(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.API_KEY}`
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  if (!checkApiKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const idx = project.nodes.findIndex((n) => n.id === params.nodeId)
  if (idx === -1) return NextResponse.json({ error: "Node not found" }, { status: 404 })
  const body = await req.json()
  project.nodes[idx] = { ...project.nodes[idx], ...body, id: params.nodeId }
  saveProject(project)
  return NextResponse.json(project.nodes[idx])
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  if (!checkApiKey(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const project = getProject(params.id)
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const idx = project.nodes.findIndex((n) => n.id === params.nodeId)
  if (idx === -1) return NextResponse.json({ error: "Node not found" }, { status: 404 })
  project.nodes.splice(idx, 1)
  saveProject(project)
  return NextResponse.json({ deleted: true })
}
