"use client"

import { create } from "zustand"

export interface CanvasComment {
  id: string
  nodeId: string
  authorName: string
  authorId: string | null
  content: string
  resolved: boolean
  createdAt: number
  offsetX: number
  offsetY: number
  parentId: string | null
}

interface CommentsState {
  comments: CanvasComment[]
  loading: boolean
  commentMode: boolean
  activeThreadId: string | null // root comment id of open thread

  // Actions
  setCommentMode: (on: boolean) => void
  toggleCommentMode: () => void
  openThread: (commentId: string | null) => void
  fetchComments: (projectId: string) => Promise<void>
  addComment: (projectId: string, payload: {
    nodeId: string
    content: string
    authorName: string
    offsetX: number
    offsetY: number
    parentId?: string | null
  }) => Promise<CanvasComment | null>
  resolveComment: (projectId: string, commentId: string, resolved: boolean) => Promise<void>
  deleteComment: (projectId: string, commentId: string) => Promise<void>
  moveComment: (projectId: string, commentId: string, offsetX: number, offsetY: number) => Promise<void>
}

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/arbo_csrf=([^;]+)/)
  return match ? match[1] : null
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra }
  const csrf = getCsrfToken()
  if (csrf) h["x-csrf-token"] = csrf
  return h
}

export const useCommentsStore = create<CommentsState>()((set, get) => ({
  comments: [],
  loading: false,
  commentMode: false,
  activeThreadId: null,

  setCommentMode: (on) => set({ commentMode: on, activeThreadId: on ? get().activeThreadId : null }),
  toggleCommentMode: () => {
    const next = !get().commentMode
    set({ commentMode: next, activeThreadId: next ? get().activeThreadId : null })
  },
  openThread: (commentId) => set({ activeThreadId: commentId }),

  fetchComments: async (projectId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`)
      if (res.ok) {
        const data = await res.json()
        set({ comments: Array.isArray(data) ? data : [] })
      }
    } catch { /* ignore */ }
    set({ loading: false })
  },

  addComment: async (projectId, payload) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const comment: CanvasComment = await res.json()
        set({ comments: [...get().comments, comment] })
        return comment
      }
    } catch { /* ignore */ }
    return null
  },

  resolveComment: async (projectId, commentId, resolved) => {
    try {
      await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ resolved }),
      })
      set({
        comments: get().comments.map(c =>
          c.id === commentId ? { ...c, resolved } : c
        ),
      })
    } catch { /* ignore */ }
  },

  moveComment: async (projectId, commentId, offsetX, offsetY) => {
    // Optimistic update
    set({
      comments: get().comments.map(c =>
        c.id === commentId ? { ...c, offsetX, offsetY } : c
      ),
    })
    try {
      await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ offsetX, offsetY }),
      })
    } catch { /* ignore — optimistic already applied */ }
  },

  deleteComment: async (projectId, commentId) => {
    try {
      await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      // Remove the comment and any replies
      set({
        comments: get().comments.filter(c => c.id !== commentId && c.parentId !== commentId),
        activeThreadId: get().activeThreadId === commentId ? null : get().activeThreadId,
      })
    } catch { /* ignore */ }
  },
}))
