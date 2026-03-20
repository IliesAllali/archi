import { authorizeRequest, apiSuccess, apiError } from '@/lib/api-auth'
import { db, getActiveNode, saveSnapshot } from '@/lib/db'
import { sanitizeText, sanitizeTextArray } from '@/lib/sanitize'
import { logAuditEntry } from '@/lib/audit'
import { emitToProject } from '@/lib/socket'

export async function GET(
  req: Request,
  { params }: { params: { id: string; nid: string } }
) {
  const auth = authorizeRequest(req, 'read', params.id)
  if (auth instanceof Response) return auth

  const node = getActiveNode(params.id, params.nid)
  if (!node) return apiError('NOT_FOUND', 'Node not found', 404)

  const data = JSON.parse(node.data)
  return apiSuccess({
    id: node.id,
    parentId: node.parent_id,
    position: node.position,
    ...data,
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; nid: string } }
) {
  const auth = authorizeRequest(req, 'write:nodes', params.id)
  if (auth instanceof Response) return auth

  const existing = getActiveNode(params.id, params.nid)
  if (!existing) return apiError('NOT_FOUND', 'Node not found', 404)

  const body = await req.json()
  const existingData = JSON.parse(existing.data)
  const previousState = { id: existing.id, parentId: existing.parent_id, position: existing.position, ...existingData }
  const now = Date.now()

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
    ...(body.cta !== undefined && { cta: sanitizeTextArray(body.cta) }),
    ...(body.tags !== undefined && { tags: sanitizeTextArray(body.tags) }),
    lastModifiedBy: 'ai' as const,
    lastModifiedByName: auth.tokenName,
  }

  const updateFields: string[] = ['data = ?', 'updated_at = ?']
  const updateValues: unknown[] = [JSON.stringify(updatedData), now]

  if (body.parentId !== undefined || body.parent_id !== undefined) {
    updateFields.push('parent_id = ?')
    updateValues.push(body.parentId ?? body.parent_id)
  }
  if (body.position !== undefined) {
    updateFields.push('position = ?')
    updateValues.push(body.position)
  }

  updateValues.push(params.nid, params.id)

  db.prepare(
    `UPDATE nodes SET ${updateFields.join(', ')} WHERE id = ? AND project_id = ?`
  ).run(...updateValues)

  // Audit with previous_state
  logAuditEntry({
    projectId: params.id,
    tokenId: auth.tokenId,
    tokenName: auth.tokenName,
    action: 'update_node',
    nodeId: params.nid,
    payload: updatedData,
    previousState,
  })

  // Socket.IO
  emitToProject(params.id, 'nodes-updated', { source: 'ai', tokenName: auth.tokenName })
  emitToProject(params.id, 'ai-action', { tokenName: auth.tokenName, action: 'update_node', nodeLabel: updatedData.label })

  return apiSuccess(
    { id: params.nid, ...updatedData },
    { action: 'node_updated', actor: `${auth.tokenName} (${auth.tokenId})` }
  )
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; nid: string } }
) {
  const auth = authorizeRequest(req, 'write:nodes', params.id)
  if (auth instanceof Response) return auth

  const existing = getActiveNode(params.id, params.nid)
  if (!existing) return apiError('NOT_FOUND', 'Node not found', 404)

  const existingData = JSON.parse(existing.data)
  const previousState = { id: existing.id, parentId: existing.parent_id, ...existingData }
  const now = Date.now()

  // Check for cascade query param
  const url = new URL(req.url)
  const cascade = url.searchParams.get('cascade') === 'true'

  if (cascade) {
    const archiveDescendants = (parentId: string) => {
      const children = db.prepare(
        'SELECT id FROM nodes WHERE parent_id = ? AND project_id = ? AND archived = 0'
      ).all(parentId, params.id) as { id: string }[]
      for (const child of children) {
        archiveDescendants(child.id)
        db.prepare('UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?').run(now, child.id)
      }
    }
    archiveDescendants(params.nid)
  } else {
    // Reparent children to grandparent
    db.prepare(
      'UPDATE nodes SET parent_id = ?, updated_at = ? WHERE parent_id = ? AND project_id = ? AND archived = 0'
    ).run(existing.parent_id, now, params.nid, params.id)
  }

  db.prepare('UPDATE nodes SET archived = 1, updated_at = ? WHERE id = ?').run(now, params.nid)

  // Audit
  logAuditEntry({
    projectId: params.id,
    tokenId: auth.tokenId,
    tokenName: auth.tokenName,
    action: 'delete_node',
    nodeId: params.nid,
    previousState,
  })

  // Snapshot + Socket
  saveSnapshot(params.id, 'delete_node', auth.tokenName, 'ai')
  emitToProject(params.id, 'nodes-updated', { source: 'ai', tokenName: auth.tokenName })
  emitToProject(params.id, 'ai-action', { tokenName: auth.tokenName, action: 'delete_node', nodeLabel: existingData.label })

  return apiSuccess(
    { deleted: true, id: params.nid, cascade },
    { action: 'node_deleted', actor: `${auth.tokenName} (${auth.tokenId})` }
  )
}
