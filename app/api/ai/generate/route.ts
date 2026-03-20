import { NextRequest, NextResponse } from "next/server";
import { generateSitemap, getProviderLabel } from "@/lib/ai";
import type { AiProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";

const VALID_PROVIDERS: AiProvider[] = ["anthropic", "openai", "mistral"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, apiKey, projectName, clientName, provider: rawProvider } = body;
    const provider: AiProvider = VALID_PROVIDERS.includes(rawProvider) ? rawProvider : "anthropic";

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

    // Rate limit
    const limit = checkAiRateLimit(payload.sub);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Limite atteinte (20/h). Réessaie dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    // Generate sitemap via AI
    const result = await generateSitemap(apiKey, prompt, provider);
    const aiLabel = getProviderLabel(provider);

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
      `INSERT OR IGNORE INTO project_members (project_id, user_id, role, added_at)
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
          lastModifiedByName: aiLabel,
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
    const message = err instanceof Error ? err.message : "";
    // Log internally but never expose raw error to client
    console.error("AI generate error:", message);

    if (message.includes("401") || message.includes("authentication") || message.includes("Incorrect API key")) {
      return NextResponse.json({ error: "Clé API invalide ou expirée." }, { status: 401 });
    }
    if (message.includes("429") || message.includes("rate")) {
      return NextResponse.json({ error: "Limite du fournisseur IA atteinte. Réessaie dans quelques secondes." }, { status: 429 });
    }

    return NextResponse.json({ error: "Erreur lors de la génération. Réessaie." }, { status: 500 });
  }
}
