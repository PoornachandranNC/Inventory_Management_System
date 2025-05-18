import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  await logout()

  // Return a JSON response with a redirect URL
  return NextResponse.json({
    success: true,
    redirect: "/login",
  })
}
