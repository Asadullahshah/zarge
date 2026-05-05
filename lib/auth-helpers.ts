import { auth } from "./auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  return session
}

