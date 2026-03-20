import { NextRequest, NextResponse } from "next/server";
import { generateSitemap } from "@/lib/ai";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, apiKey, projectName, clientName } = body;

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "prompt and apiKey are required" },
        { status: 400 }
      );
    }

    // Auth check — user must be logged in
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

    // Generate sitemap via Claude
    const result = await generateSitemap(apiKey, prompt);

    // Create project
    const projectId = nanoid();
    const slug = `${(projectName || "projet")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${nanoid(6)}`;
    const now = Date.now();

    db.prepare(
      `INSERT INTO projects (id, slug, name, client, accent, version, owner_id, archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, '#5E6AD2', 'v1', ?, 0, ?, ?)`
    ).run(
      projectId,
      slug,
      projectName || "Nouveau projet",
      clientName || null,
      payload.sub,
      now,
      now
    );

    // Add user as project member (owner)
    db.prepare(
      `INSERT OR IGNORE INTO project_members (project_id, user_id, role, joined_at)
       VALUES (?, ?, 'owner', ?)`
    ).run(projectId, payload.sub, now);

    // Insert nodes
    const tempToReal = new Map<string, string>();
    const insertStmt = db.prepare(
      `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
    );

    db.transaction(() => {
      for (const node of result.nodes) {
        const realId = nanoid();
        tempToReal.set(node.temp_id, realId);

        const parentId = node.parent_temp_id
          ? tempToReal.get(node.parent_temp_id) || null
          : null;

        const posRow = db
          .prepare(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0"
          )
          .get(projectId, parentId) as { next_pos: number };

        const data = JSON.stringify({
          label: node.label,
          type: node.type || "detail",
          priority: node.priority || "secondary",
          description: node.description || "",
          rationale: node.rationale || undefined,
          lastModifiedBy: "ai",
          lastModifiedByName: "Claude",
        });

        insertStmt.run(
          realId,
          projectId,
          parentId,
          posRow.next_pos,
          data,
          now,
          now
        );
      }
    })();

    return NextResponse.json({
      projectId,
      slug,
      nodeCount: result.nodes.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";

    // Detect Anthropic API errors
    if (message.includes("401") || message.includes("authentication")) {
      return NextResponse.json(
        { error: "Cl\u00e9 API invalide. V\u00e9rifie ta cl\u00e9 Anthropic." },
        { status: 401 }
      );
    }
    if (message.includes("429") || message.includes("rate")) {
      return NextResponse.json(
        { error: "Trop de requ\u00eates. R\u00e9essaie dans quelques secondes." },
        { status: 429 }
      );
    }

    console.error("AI generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
