import { NextRequest, NextResponse } from "next/server";
import { db, getActiveNodes } from "@/lib/db";
import type { DbNode } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic"

/**
 * Import actions JSON directly (no AI call needed).
 * Used by the copy-paste workflow in settings.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actions, projectId } = body;

    if (!projectId || !actions) {
      return NextResponse.json(
        { error: "projectId and actions are required" },
        { status: 400 }
      );
    }

    // Auth check
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

    if (!Array.isArray(actions)) {
      return NextResponse.json(
        { error: "actions must be an array" },
        { status: 400 }
      );
    }

    // Apply actions
    const now = Date.now();
    const tempToReal = new Map<string, string>();
    const applied: string[] = [];

    db.transaction(() => {
      for (const action of actions) {
        if (action.action === "add") {
          const realId = nanoid();
          if (action.temp_id) tempToReal.set(action.temp_id, realId);

          let parentId = action.parent_id || null;
          if (action.parent_temp_id) {
            parentId = tempToReal.get(action.parent_temp_id) || null;
          }

          const posRow = db
            .prepare(
              "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
            )
            .get(projectId, parentId) as { next_pos: number };

          const nodeData: Record<string, unknown> = {
            label: action.label || "Nouvelle page",
            type: action.type || "detail",
            priority: action.priority || "secondary",
            description: action.description || "",
            rationale: action.rationale || undefined,
            lastModifiedBy: "import",
            lastModifiedByName: "Import IA",
          };
          if (action.cta) nodeData.cta = action.cta;
          if (action.tags) nodeData.tags = action.tags;
          if (action.entryPoints) nodeData.entryPoints = action.entryPoints;
          if (action.zoningBlocks) {
            nodeData.zoningBlocks = action.zoningBlocks;
            nodeData.zoningExpanded = action.zoningExpanded ?? false;
          }
          const data = JSON.stringify(nodeData);

          db.prepare(
            `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
          ).run(realId, projectId, parentId, posRow.next_pos, data, now, now);

          applied.push(`add: ${action.label}`);
        }

        if (action.action === "update" && action.node_id) {
          const existing = db
            .prepare(
              "SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0"
            )
            .get(action.node_id, projectId) as DbNode | undefined;

          if (existing) {
            const data = JSON.parse(existing.data);
            if (action.label !== undefined) data.label = action.label;
            if (action.type !== undefined) data.type = action.type;
            if (action.priority !== undefined) data.priority = action.priority;
            if (action.description !== undefined)
              data.description = action.description;
            data.lastModifiedBy = "import";
            data.lastModifiedByName = "Import IA";

            db.prepare(
              "UPDATE nodes SET data = ?, updated_at = ? WHERE id = ?"
            ).run(JSON.stringify(data), now, action.node_id);

            applied.push(`update: ${data.label}`);
          }
        }

        if (action.action === "delete" && action.node_id) {
          const archiveDescendants = (parentId: string) => {
            const children = db
              .prepare(
                "SELECT id FROM nodes WHERE parent_id = ? AND project_id = ? AND archived = 0"
              )
              .all(parentId, projectId) as { id: string }[];
            for (const child of children) {
              archiveDescendants(child.id);
              db.prepare(
                "UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?"
              ).run(now, child.id);
            }
          };
          archiveDescendants(action.node_id);
          db.prepare(
            "UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?"
          ).run(now, action.node_id);

          applied.push(`delete: ${action.node_id}`);
        }

        if (action.action === "move" && action.node_id && action.parent_id !== undefined) {
          const posRow = db
            .prepare(
              "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
            )
            .get(projectId, action.parent_id) as { next_pos: number };

          db.prepare(
            "UPDATE nodes SET parent_id = ?, position = ?, updated_at = ? WHERE id = ? AND project_id = ?"
          ).run(action.parent_id, posRow.next_pos, now, action.node_id, projectId);

          applied.push(`move: ${action.node_id}`);
        }
      }
    })();

    // Return updated tree
    const updatedNodes = getActiveNodes(projectId);
    const updatedTree = updatedNodes.map((n) => {
      const data = JSON.parse(n.data);
      const children = updatedNodes
        .filter((c) => c.parent_id === n.id)
        .sort((a, b) => a.position - b.position)
        .map((c) => c.id);
      return { id: n.id, ...data, children };
    });

    return NextResponse.json({
      applied,
      nodes: updatedTree,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    console.error("AI import error:", message);
    return NextResponse.json(
      { error: "Erreur lors de l'import. Vérifie le format JSON." },
      { status: 500 }
    );
  }
}
