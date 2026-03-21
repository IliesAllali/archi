import { authorizeRequest, apiSuccess } from '@/lib/api-auth'
import { getSnapshots } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = authorizeRequest(req, 'read', params.id)
  if (auth instanceof Response) return auth

  const snapshots = getSnapshots(params.id)

  return apiSuccess(snapshots.map(s => ({
    id: s.id,
    trigger: s.trigger,
    triggeredBy: s.triggered_by,
    triggeredByType: s.triggered_by_type,
    createdAt: s.created_at,
  })))
}
