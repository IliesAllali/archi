import { getProject } from "@/lib/project-loader"
import { getSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export const dynamic = "force-dynamic"

interface Props {
  params: { project: string }
}

export default async function SettingsPage({ params }: Props) {
  const project = getProject(params.project)
  if (!project) notFound()

  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <SettingsClient
      project={{
        id: project.id,
        slug: project.slug,
        name: project.name,
        client: project.client,
        version: project.version,
        accent: project.accent,
        ownerId: project.ownerId,
        mode: project.mode || "website",
        context: project.context || "",
      }}
      currentUserId={session.sub}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const project = getProject(params.project)
  if (!project) return { title: "arbo" }
  return {
    title: `Paramètres — ${project.name} — arbo`,
  }
}
