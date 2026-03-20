import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminClient from "./AdminClient"

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/")
  }

  return <AdminClient />
}
