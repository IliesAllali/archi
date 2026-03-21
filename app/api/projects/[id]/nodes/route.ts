import { NextRequest, NextResponse } from "next/server";
import { getProject, getProjectNodes } from "@/lib/project-loader";
import { db, getNextPosition } from "@/lib/db";
import { sanitizeText, sanitizeTextArray } from "@/lib/sanitize";
import { emitToProject } from "@/lib/socket";
import { nanoid } from "nanoid";
import type { SiteNode } from "@/lib/types";

export const dynamic = "force-dynamic"

function checkApiKey(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.API_KEY}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project.nodes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkApiKey(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = getProject(params.id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const nodeId = body.id || nanoid();
  const label = sanitizeText(body.label) || "Nouvelle page";
  const parentId = body.parentId || null;
  const now = Date.now();

  const position = getNextPosition(project.id, parentId);

  const data = {
    label,
    type: body.type || "detail",
    priority: body.priority || "secondary",
    description: body.description ? sanitizeText(body.description) : "",
    notes: body.notes ? sanitizeText(body.notes) : undefined,
    rationale: body.rationale ? sanitizeText(body.rationale) : undefined,
    zoningBlocks: body.zoningBlocks || undefined,
    zoningExpanded: body.zoningExpanded || false,
    zoningHtml: body.zoningHtml || undefined,
    cta: body.cta ? sanitizeTextArray(body.cta) : undefined,
    tags: body.tags ? sanitizeTextArray(body.tags) : undefined,
  };

  db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  ).run(nodeId, project.id, parentId, position, JSON.stringify(data), now, now);

  emitToProject(project.id, "node-created", { nodeId, parentId, data });

  const createdNode: SiteNode = { id: nodeId, children: [], ...data };
  return NextResponse.json(createdNode, { status: 201 });
}
