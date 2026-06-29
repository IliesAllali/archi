import { authorizeRequest, apiSuccess, apiError } from '@/lib/api-auth'
import { db, saveSnapshot } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import { logAuditEntry } from '@/lib/audit'
import { emitToProject } from '@/lib/socket'
import { nanoid } from 'nanoid'

export const dynamic = "force-dynamic"

/**
 * Async import endpoint.
 * For small imports (<50 nodes), processes synchronously.
 * For large imports, creates an async job.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'write:nodes', params.id)
  if (auth instanceof Response) return auth

  const project = db
    .prepare('SELECT id FROM projects WHERE id = ? AND archived = 0')
    .get(params.id) as { id: string } | undefined
  if (!project) return apiError('NOT_FOUND', 'Project not found', 404)

  const body = await req.json()
  if (!Array.isArray(body.nodes)) {
    return apiError('INVALID_BODY', 'Expected { nodes: [...] } with temp_id references', 400)
  }

  const nodes = body.nodes as {
    temp_id: string
    parent_temp_id: string | null
    label: string
    type?: string
    priority?: string
    description?: string
    rationale?: string
    notes?: string
    group?: string
  }[]

  // For large imports, use async job pattern
  if (nodes.length > 50) {
    const jobId = nanoid()
    const now = Date.now()

    db.prepare(
      'INSERT INTO async_jobs (id, project_id, type, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(jobId, params.id, 'bulk_import', 'pending', JSON.stringify({ nodes, tokenId: auth.tokenId, tokenName: auth.tokenName }), now)

    // Process in background via setImmediate
    setImmediate(() => processImportJob(jobId, params.id, nodes, auth.tokenId, auth.tokenName))

    return apiSuccess(
      { jobId, status: 'pending', nodeCount: nodes.length },
      { action: 'bulk_import_started', actor: `${auth.tokenName} (${auth.tokenId})` },
      202
    )
  }

  // Small import — process synchronously
  const result = executeImport(params.id, nodes, auth.tokenId, auth.tokenName)

  return apiSuccess(
    result,
    { action: 'bulk_import', actor: `${auth.tokenName} (${auth.tokenId})` },
    201
  )
}

function executeImport(
  projectId: string,
  nodes: { temp_id: string; parent_temp_id: string | null; label: string; type?: string; priority?: string; description?: string; rationale?: string; notes?: string; group?: string }[],
  tokenId: string,
  tokenName: string
) {
  const now = Date.now()
  const tempToReal = new Map<string, string>()
  const created: { tempId: string; realId: string; label: string }[] = []

  const insertStmt = db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  )

  db.transaction(() => {
    for (const node of nodes) {
      const realId = nanoid()
      tempToReal.set(node.temp_id, realId)

      const parentId = node.parent_temp_id ? (tempToReal.get(node.parent_temp_id) || null) : null

      const posRow = db.prepare(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM nodes WHERE project_id = ? AND parent_id IS ? AND archived = 0'
      ).get(projectId, parentId) as { next_pos: number }

      const data = JSON.stringify({
        label: sanitizeText(node.label) || 'Page',
        type: node.type || 'detail',
        priority: node.priority || 'secondary',
        description: node.description ? sanitizeText(node.description) : '',
        rationale: node.rationale ? sanitizeText(node.rationale) : undefined,
        notes: node.notes ? sanitizeText(node.notes) : undefined,
        group: node.group || undefined,
        lastModifiedBy: 'ai',
        lastModifiedByName: tokenName,
      })

      insertStmt.run(realId, projectId, parentId, posRow.next_pos, data, now, now)
      created.push({ tempId: node.temp_id, realId, label: node.label })
    }

    saveSnapshot(projectId, 'bulk_import', tokenName, 'ai')
  })()

  logAuditEntry({
    projectId,
    tokenId,
    tokenName,
    action: 'bulk_import',
    payload: { nodesCreated: created.length },
  })

  emitToProject(projectId, 'nodes-updated', { source: 'ai', tokenName })
  emitToProject(projectId, 'ai-action', { tokenName, action: 'bulk_import', nodeLabel: `${created.length} pages` })

  return { nodesCreated: created.length, nodes: created }
}

function processImportJob(
  jobId: string,
  projectId: string,
  nodes: { temp_id: string; parent_temp_id: string | null; label: string; type?: string; priority?: string; description?: string; rationale?: string; notes?: string; group?: string }[],
  tokenId: string,
  tokenName: string
) {
  try {
    db.prepare('UPDATE async_jobs SET status = ? WHERE id = ?').run('running', jobId)

    const result = executeImport(projectId, nodes, tokenId, tokenName)

    db.prepare('UPDATE async_jobs SET status = ?, result = ?, completed_at = ? WHERE id = ?')
      .run('done', JSON.stringify(result), Date.now(), jobId)

    // Notify via Socket.IO
    emitToProject(projectId, 'job-completed', { jobId, status: 'done', summary: `${result.nodesCreated} pages imported` })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    db.prepare('UPDATE async_jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
      .run('failed', message, Date.now(), jobId)

    emitToProject(projectId, 'job-completed', { jobId, status: 'failed', error: message })
  }
}
