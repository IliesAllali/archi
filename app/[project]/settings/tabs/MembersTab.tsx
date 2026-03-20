"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, X, Loader2, Crown, Edit3, Eye } from "lucide-react"
import { csrfHeaders } from "../use-csrf"

interface Member {
  user_id: string
  role: string
  added_at: number
  name: string
  email: string
  color: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: number
  accepted_at: number | null
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propri\u00e9taire",
  editor: "\u00c9diteur",
  viewer: "Lecteur",
}

export default function MembersTab({
  projectId,
  currentUserId,
  ownerId,
}: {
  projectId: string
  currentUserId: string
  ownerId?: string
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("editor")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState("")

  const isOwner = ownerId === currentUserId || members.some(
    (m) => m.user_id === currentUserId && m.role === "owner"
  )

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/invitations`),
      ])
      if (membersRes.ok) setMembers(await membersRes.json())
      if (invitationsRes.ok) setInvitations(await invitationsRes.json())
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError("")
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erreur")
        return
      }
      setInviteEmail("")
      fetchData()
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (userId: string, role: string) => {
    await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      headers: csrfHeaders(),
      body: JSON.stringify({ role }),
    })
    fetchData()
  }

  const handleRemoveMember = async (userId: string) => {
    await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
      headers: csrfHeaders(),
    })
    fetchData()
  }

  const handleCancelInvitation = async (invitationId: string) => {
    await fetch(`/api/projects/${projectId}/invitations`, {
      method: "DELETE",
      headers: csrfHeaders(),
      body: JSON.stringify({ invitationId }),
    })
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Membres du projet
        </h2>
        <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
          G\u00e9rez les acc\u00e8s et les r\u00f4les.
        </p>
      </div>

      {/* Invite form */}
      {isOwner && (
        <div
          className="p-4 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <label className="text-2xs font-medium uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)" }}>
            Ajouter un membre
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--line)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite() }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-2 py-2 rounded-lg text-xs outline-none cursor-pointer"
              style={{
                background: "var(--canvas-bg)",
                border: "1px solid var(--line)",
                color: "var(--text-primary)",
              }}
            >
              <option value="editor">\u00c9diteur</option>
              <option value="viewer">Lecteur</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Ajouter
            </button>
          </div>
          {error && (
            <p className="text-2xs mt-2" style={{ color: "var(--error-text)" }}>{error}</p>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-1">
        {members.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role] || Eye
          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold shrink-0"
                  style={{ backgroundColor: member.color, color: "#fff" }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium block truncate" style={{ color: "var(--text-primary)" }}>
                    {member.name}
                    {member.user_id === currentUserId && (
                      <span className="text-2xs ml-1" style={{ color: "var(--text-faint)" }}>(vous)</span>
                    )}
                  </span>
                  <span className="text-2xs block truncate" style={{ color: "var(--text-muted)" }}>
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-2xs" style={{ color: "var(--text-muted)" }}>
                  <RoleIcon className="w-3 h-3" />
                  {ROLE_LABELS[member.role] || member.role}
                </div>

                {isOwner && member.role !== "owner" && member.user_id !== currentUserId && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                      className="px-1.5 py-1 rounded text-2xs outline-none cursor-pointer"
                      style={{
                        background: "var(--canvas-bg)",
                        border: "1px solid var(--line)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="editor">\u00c9diteur</option>
                      <option value="viewer">Lecteur</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-1 rounded-md hover:bg-bg-hover transition-colors"
                      style={{ color: "var(--text-faint)" }}
                      title="Retirer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending invitations */}
      {invitations.filter((inv) => !inv.accepted_at).length > 0 && (
        <div>
          <label className="text-2xs font-medium uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)" }}>
            Invitations en attente
          </label>
          <div className="space-y-1">
            {invitations
              .filter((inv) => !inv.accepted_at)
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                  style={{ background: "var(--surface)", border: "1px dashed var(--line)" }}
                >
                  <div className="min-w-0">
                    <span className="text-xs block truncate" style={{ color: "var(--text-muted)" }}>
                      {inv.email}
                    </span>
                    <span className="text-2xs" style={{ color: "var(--text-faint)" }}>
                      {ROLE_LABELS[inv.role] || inv.role} &middot; expire {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="p-1 rounded-md hover:bg-bg-hover transition-colors"
                      style={{ color: "var(--text-faint)" }}
                      title="Annuler l'invitation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
