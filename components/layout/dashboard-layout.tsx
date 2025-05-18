import type React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-at-least-32-characters")

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get the token from cookies
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  // Verify the token
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as "admin" | "staff",
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Header username={user.username} userRole={user.role} />
        <div className="flex flex-1">
          <aside className="hidden w-64 md:block border-r">
            <Sidebar userRole={user.role} />
          </aside>
          <main className="flex-1 p-6 pt-3">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Auth error:", error)
    redirect("/login")
  }
}
