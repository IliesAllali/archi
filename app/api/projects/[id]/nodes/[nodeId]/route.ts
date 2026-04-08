import { NextRequest, NextResponse } from "next/server";
import { db, getActiveNode } from "@/lib/db";
import { getProject, getNode } from "@/lib/project-loader";
import { sanitizeText, sanitizeTextArray } from "@/lib/sanitize";
import { emitToProject } from "@/lib/socket";
import { requireProjectRead, requireProjectWrite } from "@/lib/project-access";

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  const access = await requireProjectRead(req, params.id);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const node = getNode(params.id, params.nodeId);
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  return NextResponse.json(node);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  const access = await requireProjectWrite(req, params.id);
  if (!access)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = getActiveNode(project.id, params.nodeId);
  if (!existing) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const body = await req.json();
  const existingData = JSON.parse(existing.data);
  const now = Date.now();

  const updatedData = {
    ...existingData,
    ...(body.label !== undefined && { label: sanitizeText(body.label) || existingData.label }),
    ...(body.type !== undefined && { type: body.type }),
    ...(body.priority !== undefined && { priority: body.priority }),
    ...(body.description !== undefined && { description: sanitizeText(body.description) }),
    ...(body.notes !== undefined && { notes: sanitizeText(body.notes) }),
    ...(body.rationale !== undefined && { rationale: sanitizeText(body.rationale) }),
    ...(body.zoningBlocks !== undefined && { zoningBlocks: body.zoningBlocks }),
    ...(body.zoningExpanded !== undefined && { zoningExpanded: body.zoningExpanded }),
    ...(body.zoningHtml !== undefined && { zoningHtml: body.zoningHtml }),
    ...(body.annotations !== undefined && { annotations: body.annotations }),
    ...(body.zoningCanvasMode !== undefined && { zoningCanvasMode: body.zoningCanvasMode }),
    ...(body.cta !== undefined && { cta: sanitizeTextArray(body.cta) }),
    ...(body.tags !== undefined && { tags: sanitizeTextArray(body.tags) }),
  };

  const updateFields: string[] = ["data = ?", "updated_at = ?"];
  const updateValues: unknown[] = [JSON.stringify(updatedData), now];

  if (body.parentId !== undefined) {
    updateFields.push("parent_id = ?");
    updateValues.push(body.parentId);
  }
  if (body.position !== undefined) {
    updateFields.push("position = ?");
    updateValues.push(body.position);
  }

  updateValues.push(params.nodeId, project.id);

  db.prepare(
    `UPDATE nodes SET ${updateFields.join(", ")} WHERE id = ? AND project_id = ?`
  ).run(...updateValues);

  emitToProject(project.id, "node-updated", {
    nodeId: params.nodeId,
    data: updatedData,
  });

  return NextResponse.json({ id: params.nodeId, ...updatedData });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  const deleteAccess = await requireProjectWrite(req, params.id);
  if (!deleteAccess)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = getActiveNode(project.id, params.nodeId);
  if (!existing) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const now = Date.now();

  // Soft delete
  db.prepare(
    "UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ? AND project_id = ?"
  ).run(now, params.nodeId, project.id);

  emitToProject(project.id, "node-deleted", { nodeId: params.nodeId });

  return NextResponse.json({ deleted: true });
}
