import { NextRequest, NextResponse } from "next/server";
import { db, getActiveNodes, saveSnapshot } from "@/lib/db";
import { getProject } from "@/lib/project-loader";
import { sanitizeText, sanitizeTextArray } from "@/lib/sanitize";
import { emitToProject } from "@/lib/socket";
import { nanoid } from "nanoid";
import type { SiteNode } from "@/lib/types";

const STRUCTURAL_TRIGGERS = new Set(["create_node", "delete_node", "reparent", "bulk_import", "restore"]);

/**
 * PUT /api/projects/[id]/nodes/sync
 * Full sync of all nodes from the canvas editor.
 * Replaces the entire node set for the project (active nodes only).
 * This is the auto-save endpoint — called debounced from the client.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Auth check — must be a project member to sync
  const { verifyAccessToken } = await import("@/lib/auth");
  const token =
    req.cookies.get("arbo_access")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(params.id, payload.sub) as { role: string } | undefined;
  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const clientNodes: SiteNode[] = body.nodes;
  const triggers: string[] = body.triggers || [];

  if (!Array.isArray(clientNodes)) {
    return NextResponse.json({ error: "nodes must be an array" }, { status: 400 });
  }

  const now = Date.now();

  // Build a children→parent map for position ordering
  const parentMap = new Map<string, string | null>();
  const childrenMap = new Map<string | null, string[]>();

  for (const node of clientNodes) {
    for (const childId of node.children || []) {
      parentMap.set(childId, node.id);
      if (!childrenMap.has(node.id)) childrenMap.set(node.id, []);
      childrenMap.get(node.id)!.push(childId);
    }
  }

  // Root nodes: those not appearing as any child
  const allChildIds = new Set(parentMap.keys());
  for (const node of clientNodes) {
    if (!allChildIds.has(node.id)) {
      parentMap.set(node.id, null);
      if (!childrenMap.has(null)) childrenMap.set(null, []);
      childrenMap.get(null)!.push(node.id);
    }
  }

  // Get existing node IDs in DB
  const existingRows = getActiveNodes(project.id);
  const existingIds = new Set(existingRows.map((r) => r.id));
  const clientIds = new Set(clientNodes.map((n) => n.id));

  const upsertStmt = db.prepare(`
    INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      parent_id = excluded.parent_id,
      position = excluded.position,
      data = excluded.data,
      updated_at = excluded.updated_at
  `);

  const archiveStmt = db.prepare(
    "UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ? AND project_id = ?"
  );

  const syncTransaction = db.transaction(() => {
    // Upsert all client nodes
    for (const node of clientNodes) {
      const pid = parentMap.get(node.id) ?? null;
      const siblings = childrenMap.get(pid) ?? [];
      const position = siblings.indexOf(node.id);

      const { id, children, position: _pos, ...dataFields } = node;
      const sanitizedData = {
        ...dataFields,
        label: sanitizeText(dataFields.label) || "Sans titre",
        description: dataFields.description ? sanitizeText(dataFields.description) : undefined,
        notes: dataFields.notes ? sanitizeText(dataFields.notes) : undefined,
        rationale: dataFields.rationale ? sanitizeText(dataFields.rationale) : undefined,
        cta: dataFields.cta ? sanitizeTextArray(dataFields.cta) : undefined,
        tags: dataFields.tags ? sanitizeTextArray(dataFields.tags) : undefined,
      };

      upsertStmt.run(
        node.id,
        project.id,
        pid,
        position >= 0 ? position : 0,
        JSON.stringify(sanitizedData),
        existingIds.has(node.id) ? now : now, // created_at for new, ignored by ON CONFLICT
        now
      );
    }

    // Archive nodes that were deleted on client
    for (const existingId of existingIds) {
      if (!clientIds.has(existingId)) {
        archiveStmt.run(now, existingId, project.id);
      }
    }
  });

  try {
    syncTransaction();

    const structuralTrigger = triggers.find((t) => STRUCTURAL_TRIGGERS.has(t));
    if (structuralTrigger) {
      try {
        saveSnapshot(project.id, structuralTrigger, "user", "human");
      } catch (snapErr) {
        console.error("Snapshot save error (non-blocking):", snapErr);
      }
    }

    emitToProject(project.id, "nodes-updated", {
      projectId: project.id,
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      synced: clientNodes.length,
      archived: [...existingIds].filter((id) => !clientIds.has(id)).length,
      snapshot: !!structuralTrigger,
    });
  } catch (err) {
    console.error("Node sync error:", err);
    return NextResponse.json(
      { error: "Database sync failed" },
      { status: 500 }
    );
  }
}
