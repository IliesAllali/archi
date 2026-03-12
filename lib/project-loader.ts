import fs from "fs"
import path from "path"
import type { Project } from "./types"

const DATA_DIR = path.join(process.cwd(), "data", "projects")

export function getAllProjects(): Project[] {
  if (!fs.existsSync(DATA_DIR)) return []
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"))
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8")
    return JSON.parse(raw) as Project
  }).sort((a, b) => b.date.localeCompare(a.date))
}

export function getProject(id: string): Project | null {
  const filePath = path.join(DATA_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as Project
}

export function saveProject(project: Project): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  const filePath = path.join(DATA_DIR, `${project.id}.json`)
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), "utf-8")
}

export function deleteProject(id: string): boolean {
  const filePath = path.join(DATA_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}
