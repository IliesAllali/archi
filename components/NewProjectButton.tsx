"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import NewProjectModal from "./NewProjectModal"

export default function NewProjectButton({ variant }: { variant: "small" | "large" }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === "large" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.97]"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          Créer un projet
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.97]"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      )}

      <NewProjectModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
