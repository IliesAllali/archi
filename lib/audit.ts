/**
 * AI audit log — tracks every action performed via API tokens.
 * Stores previous_state for undo/debugging.
 */

import { db } from './db'
import { nanoid } from 'nanoid'

export interface AuditEntry {
  projectId: string
  tokenId: string
  tokenName: string
  action: string
  nodeId?: string
  payload?: unknown
  previousState?: unknown
}

export function logAuditEntry(entry: AuditEntry): void {
  db.prepare(
    `INSERT INTO ai_audit_log (id, project_id, token_id, token_name, action, node_id, payload, previous_state, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    nanoid(),
    entry.projectId,
    entry.tokenId,
    entry.tokenName,
    entry.action,
    entry.nodeId ?? null,
    entry.payload ? JSON.stringify(entry.payload) : null,
    entry.previousState ? JSON.stringify(entry.previousState) : null,
    Date.now()
  )
}

export interface AuditLogRow {
  id: string
  project_id: string
  token_id: string
  token_name: string
  action: string
  node_id: string | null
  payload: string | null
  previous_state: string | null
  created_at: number
}

export function getAuditLog(projectId: string, limit = 50): AuditLogRow[] {
  return db
    .prepare(
      'SELECT * FROM ai_audit_log WHERE project_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .all(projectId, limit) as AuditLogRow[]
}
