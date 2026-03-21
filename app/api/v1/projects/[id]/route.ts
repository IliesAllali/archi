import { authorizeRequest, apiSuccess, apiError } from '@/lib/api-auth'
import { db, getActiveNodes } from '@/lib/db'
import type { DbProject } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'read', params.id)
  if (auth instanceof Response) return auth

  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND archived = 0')
    .get(params.id) as DbProject | undefined

  if (!project) return apiError('NOT_FOUND', 'Project not found', 404)

  const nodes = getActiveNodes(params.id)
  const parsed = nodes.map(n => {
    const data = JSON.parse(n.data)
    return { id: n.id, parentId: n.parent_id, position: n.position, ...data }
  })

  return apiSuccess({
    id: project.id,
    slug: project.slug,
    name: project.name,
    client: project.client,
    accent: project.accent,
    version: project.version,
    nodeCount: nodes.length,
    nodes: parsed,
  }, { actor: `${auth.tokenName} (${auth.tokenId})` })
}
