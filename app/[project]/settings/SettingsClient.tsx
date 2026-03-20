"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Settings, Users, Link2, Key, AlertTriangle } from "lucide-react"
import Logo from "@/components/Logo"
import GeneralTab from "./tabs/GeneralTab"
import MembersTab from "./tabs/MembersTab"
import ShareTab from "./tabs/ShareTab"
import TokensTab from "./tabs/TokensTab"
import DangerTab from "./tabs/DangerTab"

interface ProjectMeta {
  id: string
  slug: string
  name: string
  client: string
  version: string
  accent: string
  ownerId?: string
}

const TABS = [
  { id: "general", label: "G\u00e9n\u00e9ral", icon: Settings },
  { id: "members", label: "Membres", icon: Users },
  { id: "share", label: "Liens de partage", icon: Link2 },
  { id: "tokens", label: "Tokens IA", icon: Key },
  { id: "danger", label: "Zone danger", icon: AlertTriangle },
] as const

type TabId = typeof TABS[number]["id"]

export default function SettingsClient({
  project,
  currentUserId,
}: {
  project: ProjectMeta
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [projectName, setProjectName] = useState(project.name)

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas-bg)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-3 h-11 shrink-0"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            href={`/${project.id}`}
            className="p-1.5 rounded-md hover:bg-bg-hover transition-colors duration-100 active:scale-95 shrink-0"
            style={{ color: "var(--text-faint)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: "var(--card-title-bg)",
              border: "1px solid var(--card-ring)",
            }}
          >
            <Logo size={12} />
          </div>
          <span style={{ color: "var(--text-faint)" }} className="select-none text-xs">
            /
          </span>
          <span
            className="text-xs font-medium truncate max-w-[180px]"
            style={{ color: "var(--text-muted)" }}
          >
            {projectName}
          </span>
          <span style={{ color: "var(--text-faint)" }} className="select-none text-xs">
            /
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Param\u00e8tres
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Tab nav */}
        <div
          className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-100 border-b-2 -mb-px"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottomColor: isActive ? "var(--text-primary)" : "transparent",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === "general" && (
          <GeneralTab project={project} onNameChange={setProjectName} />
        )}
        {activeTab === "members" && (
          <MembersTab projectId={project.id} currentUserId={currentUserId} ownerId={project.ownerId} />
        )}
        {activeTab === "share" && (
          <ShareTab projectId={project.id} />
        )}
        {activeTab === "tokens" && (
          <TokensTab projectId={project.id} />
        )}
        {activeTab === "danger" && (
          <DangerTab projectId={project.id} projectName={project.name} />
        )}
      </div>
    </div>
  )
}
