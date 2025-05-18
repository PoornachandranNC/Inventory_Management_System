import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-server"

export default async function HomePage() {
  const user = await getCurrentUser()

  // If user is logged in, redirect to dashboard
  // Otherwise, redirect to login page
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }

  // This won't be reached, but is needed for TypeScript
  return null
}
