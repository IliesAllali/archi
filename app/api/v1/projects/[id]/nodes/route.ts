import { authorizeRequest, apiSuccess, apiError } from '@/lib/api-auth'
import { db, getActiveNodes, getNextPosition, saveSnapshot } from '@/lib/db'
import { sanitizeText, sanitizeTextArray } from '@/lib/sanitize'
import { logAuditEntry } from '@/lib/audit'
import { emitToProject } from '@/lib/socket'
import { nanoid } from 'nanoid'
import type { DbProject } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'read', params.id)
  if (auth instanceof Response) return auth

  const nodes = getActiveNodes(params.id)
  const parsed = nodes.map(n => {
    const data = JSON.parse(n.data)
    return { id: n.id, parentId: n.parent_id, position: n.position, ...data }
  })

  return apiSuccess(parsed)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'write:nodes', params.id)
  if (auth instanceof Response) return auth

  const project = db
    .prepare('SELECT id FROM projects WHERE id = ? AND archived = 0')
    .get(params.id) as DbProject | undefined
  if (!project) return apiError('NOT_FOUND', 'Project not found', 404)

  const body = await req.json()
  const nodeId = nanoid()
  const label = sanitizeText(body.label) || 'Nouvelle page'
  const parentId = body.parentId ?? body.parent_id ?? null
  const now = Date.now()
  const position = getNextPosition(params.id, parentId)

  const data = {
    label,
    type: body.type || 'detail',
    priority: body.priority || 'secondary',
    description: body.description ? sanitizeText(body.description) : '',
    notes: body.notes ? sanitizeText(body.notes) : undefined,
    rationale: body.rationale ? sanitizeText(body.rationale) : undefined,
    group: body.group || undefined,
    childLayout: body.childLayout || undefined,
    childCols: body.childCols || undefined,
    zoningBlocks: body.zoningBlocks || undefined,
    zoningExpanded: body.zoningExpanded || false,
    zoningHtml: body.zoningHtml || undefined,
    cta: body.cta ? sanitizeTextArray(body.cta) : undefined,
    tags: body.tags ? sanitizeTextArray(body.tags) : undefined,
    lastModifiedBy: 'ai' as const,
    lastModifiedByName: auth.tokenName,
  }

  db.prepare(
    `INSERT INTO nodes (id, project_id, parent_id, position, archived, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  ).run(nodeId, params.id, parentId, position, JSON.stringify(data), now, now)

  // Audit log
  logAuditEntry({
    projectId: params.id,
    tokenId: auth.tokenId,
    tokenName: auth.tokenName,
    action: 'create_node',
    nodeId,
    payload: data,
  })

  // Version snapshot
  saveSnapshot(params.id, 'create_node', auth.tokenName, 'ai')

  // Socket.IO
  emitToProject(params.id, 'nodes-updated', { source: 'ai', tokenName: auth.tokenName })
  emitToProject(params.id, 'ai-action', { tokenName: auth.tokenName, action: 'create_node', nodeLabel: label })

  return apiSuccess(
    { id: nodeId, parentId, ...data },
    { action: 'node_created', actor: `${auth.tokenName} (${auth.tokenId})` },
    201
  )
}
