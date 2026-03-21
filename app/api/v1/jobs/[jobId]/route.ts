import { authenticateApiToken, apiSuccess, apiError } from '@/lib/api-auth'
import { db } from '@/lib/db'

export const dynamic = "force-dynamic"

interface AsyncJob {
  id: string
  project_id: string
  type: string
  status: string
  result: string | null
  error: string | null
  created_at: number
  completed_at: number | null
}

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  const token = authenticateApiToken(req)
  if (!token) return apiError('UNAUTHORIZED', 'Invalid or missing API token', 401)

  const job = db
    .prepare('SELECT * FROM async_jobs WHERE id = ?')
    .get(params.jobId) as AsyncJob | undefined

  if (!job) return apiError('NOT_FOUND', 'Job not found', 404)

  // Ensure token has access to this project
  if (job.project_id !== token.projectId) {
    return apiError('FORBIDDEN', 'Token does not have access to this job', 403)
  }

  const response: Record<string, unknown> = {
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.created_at,
    completedAt: job.completed_at,
  }

  if (job.status === 'done' && job.result) {
    response.result = JSON.parse(job.result)
  }
  if (job.status === 'failed' && job.error) {
    response.error = job.error
  }

  return apiSuccess(response)
}
