import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (user) {
      return NextResponse.json({ user })
    } else {
      return NextResponse.json({ user: null }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
