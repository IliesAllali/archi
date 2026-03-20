import { authorizeRequest, apiSuccess, apiError } from '@/lib/api-auth'
import { db, saveSnapshot } from '@/lib/db'
import { sanitizeText } from '@/lib/sanitize'
import { logAuditEntry } from '@/lib/audit'
import { emitToProject } from '@/lib/socket'
import { nanoid } from 'nanoid'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'write:nodes', params.id)
  if (auth instanceof Response) return auth

  const body = await req.json()
  if (!Array.isArray(body.nodes)) {
    return apiError('INVALID_BODY', 'Expected { nodes: [...] }', 400)
  }

  const now = Date.now()
  const results: { id: string; updated: boolean }[] = []

  db.transaction(() => {
    for (const update of body.nodes) {
      if (!update.id) continue

      const existing = db.prepare(
        'SELECT * FROM nodes WHERE id = ? AND project_id = ? AND archived = 0'
      ).get(update.id, params.id) as { id: string; data: string } | undefined

      if (!existing) {
        results.push({ id: update.id, updated: false })
        continue
      }

      const existingData = JSON.parse(existing.data)
      const updatedData = {
        ...existingData,
        ...(update.label !== undefined && { label: sanitizeText(update.label) || existingData.label }),
        ...(update.type !== undefined && { type: update.type }),
        ...(update.priority !== undefined && { priority: update.priority }),
        ...(update.description !== undefined && { description: sanitizeText(update.description) }),
        lastModifiedBy: 'ai' as const,
        lastModifiedByName: auth.tokenName,
      }

      const fields: string[] = ['data = ?', 'updated_at = ?']
      const values: unknown[] = [JSON.stringify(updatedData), now]

      if (update.parentId !== undefined || update.parent_id !== undefined) {
        fields.push('parent_id = ?')
        values.push(update.parentId ?? update.parent_id)
      }
      if (update.position !== undefined) {
        fields.push('position = ?')
        values.push(update.position)
      }

      values.push(update.id, params.id)
      db.prepare(`UPDATE nodes SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`).run(...values)

      logAuditEntry({
        projectId: params.id,
        tokenId: auth.tokenId,
        tokenName: auth.tokenName,
        action: 'update_node',
        nodeId: update.id,
        payload: updatedData,
        previousState: existingData,
      })

      results.push({ id: update.id, updated: true })
    }
  })()

  emitToProject(params.id, 'nodes-updated', { source: 'ai', tokenName: auth.tokenName })

  return apiSuccess(
    { updated: results.filter(r => r.updated).length, results },
    { action: 'bulk_update', actor: `${auth.tokenName} (${auth.tokenId})` }
  )
}
