"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Settings, Users, Link2, AlertTriangle, Sparkles, PenTool } from "lucide-react"
import Logo from "@/components/Logo"
import { useT } from "@/lib/app-i18n"
import GeneralTab from "./tabs/GeneralTab"
import MembersTab from "./tabs/MembersTab"
import ShareTab from "./tabs/ShareTab"
import DangerTab from "./tabs/DangerTab"
import AiConnectTab from "./tabs/AiConnectTab"
import WireframeTab from "./tabs/WireframeTab"

interface ProjectMeta {
  id: string
  slug: string
  name: string
  client: string
  version: string
  accent: string
  ownerId?: string
}

const TAB_IDS = ["general", "wireframe", "ai", "members", "share", "danger"] as const
const TAB_ICONS = {
  general: Settings,
  wireframe: PenTool,
  ai: Sparkles,
  members: Users,
  share: Link2,
  danger: AlertTriangle,
} as const

type TabId = typeof TAB_IDS[number]

export default function SettingsClient({
  project,
  currentUserId,
}: {
  project: ProjectMeta
  currentUserId: string
}) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get("tab")
    if (tab && TAB_IDS.includes(tab as TabId)) return tab as TabId
    return "general"
  })
  const [projectName, setProjectName] = useState(project.name)

  const handleBack = useCallback(() => {
    router.push(`/${project.slug || project.id}`)
    router.refresh()
  }, [router, project.slug, project.id])

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
          <button
            onClick={handleBack}
            className="p-1.5 rounded-md hover:bg-bg-hover transition-colors duration-100 active:scale-95 shrink-0"
            style={{ color: "var(--text-faint)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
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
            {t("settings.pageTitle")}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Tab nav */}
        <div
          className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          {TAB_IDS.map((tabId) => {
            const Icon = TAB_ICONS[tabId]
            const isActive = activeTab === tabId
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-100 border-b-2 -mb-px"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottomColor: isActive ? "var(--text-primary)" : "transparent",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(`settings.tabs.${tabId}` as Parameters<typeof t>[0])}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === "general" && (
          <GeneralTab project={project} onNameChange={setProjectName} />
        )}
        {activeTab === "wireframe" && (
          <WireframeTab projectId={project.id} />
        )}
        {activeTab === "ai" && (
          <AiConnectTab projectId={project.id} />
        )}
        {activeTab === "members" && (
          <MembersTab projectId={project.id} currentUserId={currentUserId} ownerId={project.ownerId} />
        )}
        {activeTab === "share" && (
          <ShareTab projectId={project.id} />
        )}
        {activeTab === "danger" && (
          <DangerTab projectId={project.id} projectName={project.name} />
        )}
      </div>
    </div>
  )
}
