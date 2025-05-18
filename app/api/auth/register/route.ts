import { type NextRequest, NextResponse } from "next/server"
import { register, isAdmin } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is an admin
    const admin = await isAdmin()

    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { username, password, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password are required" }, { status: 400 })
    }

    // Validate role
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 })
    }

    const result = await register(username, password, role)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: result.message || "Registration failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during registration" }, { status: 500 })
  }
}
