import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AccountClient from "./AccountClient"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return <AccountClient />
}
