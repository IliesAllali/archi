import { NextRequest, NextResponse } from "next/server"
import { getNode, getProject } from "@/lib/project-loader"
import { requireProjectRead } from "@/lib/project-access"

export const dynamic = "force-dynamic"

/**
 * GET — returns the stored zoningHtml for a node (if any).
 * Used for quick retrieval without re-generating.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  const access = await requireProjectRead(req, params.id)
  if (!access)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = getProject(params.id)
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const node = getNode(params.id, params.nodeId)
  if (!node)
    return NextResponse.json({ error: "Node not found" }, { status: 404 })

  if (!node.zoningHtml) {
    return NextResponse.json({ html: null })
  }

  const format = req.nextUrl.searchParams.get("format")
  if (format === "raw") {
    return new Response(node.zoningHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  }

  return NextResponse.json({ html: node.zoningHtml, pageLabel: node.label })
}
