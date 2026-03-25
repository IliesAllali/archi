/**
 * Project access control — shared between internal API routes.
 * Handles session users, share-link guests, and API key auth.
 */

import { NextRequest } from 'next/server'
import { getSession } from './auth'
import { db } from './db'
import type { DbProject } from './db'

export type AccessLevel = 'owner' | 'editor' | 'viewer' | 'guest' | null

export interface ProjectAccess {
  level: AccessLevel
  userId: string | null
}

/**
 * Check if the current request has access to a project.
 * Checks (in order):
 * 1. API key (process.env.API_KEY) → owner-level
 * 2. Session cookie (logged-in user) → role from project_members
 * 3. Per-project guest cookie (share link) → guest-level (read only)
 *
 * Returns { level, userId } or { level: null } if no access.
 */
export async function getProjectAccess(
  req: NextRequest,
  idOrSlug: string
): Promise<ProjectAccess> {
  // Resolve project first (supports both id and slug like getProject)
  const project = db
    .prepare('SELECT id, slug, owner_id FROM projects WHERE (id = ? OR slug = ?) AND archived = 0')
    .get(idOrSlug, idOrSlug) as { id: string; slug: string; owner_id: string } | undefined

  if (!project) {
    return { level: null, userId: null }
  }

  const realId = project.id

  // 1. API key auth
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${process.env.API_KEY}`) {
    return { level: 'owner', userId: 'system' }
  }

  // 2. Session auth (logged-in user)
  const session = await getSession()
  if (session) {
    if (project.owner_id === session.sub) {
      return { level: 'owner', userId: session.sub }
    }

    // Check membership
    const member = db
      .prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(realId, session.sub) as { role: string } | undefined

    if (member) {
      const level = member.role === 'owner' ? 'owner'
        : member.role === 'editor' ? 'editor'
        : 'viewer'
      return { level, userId: session.sub }
    }

    // Logged in but not a member → no access
    return { level: null, userId: session.sub }
  }

  // 3. Per-project guest cookie (share link)
  const { verifySession } = await import('./auth')

  // Try cookie by slug (set by share/verify)
  const slugCookie = req.cookies.get(`arbo_project_${project.slug}`)?.value
  if (slugCookie) {
    const guestSession = await verifySession(slugCookie)
    if (guestSession) {
      return { level: 'guest', userId: null }
    }
  }
  // Try cookie by ID (fallback)
  const idCookie = req.cookies.get(`arbo_project_${realId}`)?.value
  if (idCookie) {
    const guestSession = await verifySession(idCookie)
    if (guestSession) {
      return { level: 'guest', userId: null }
    }
  }

  return { level: null, userId: null }
}

/**
 * Quick check: does the request have at least read access to the project?
 */
export async function requireProjectRead(
  req: NextRequest,
  projectId: string
): Promise<ProjectAccess | null> {
  const access = await getProjectAccess(req, projectId)
  if (!access.level) return null
  return access
}

/**
 * Quick check: does the request have write access (owner or editor)?
 */
export async function requireProjectWrite(
  req: NextRequest,
  projectId: string
): Promise<ProjectAccess | null> {
  const access = await getProjectAccess(req, projectId)
  if (access.level === 'owner' || access.level === 'editor') return access
  return null
}
