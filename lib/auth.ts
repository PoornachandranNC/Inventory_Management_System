import { cookies } from "next/headers"
import { executeQuery } from "./db"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-at-least-32-characters")

// User type
export type User = {
  id: number
  username: string
  role: "admin" | "staff"
}

// Login function
export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const query = "SELECT id, username, password, role FROM users WHERE username = ?"
    const users = await executeQuery<any[]>({ query, values: [username] })

    if (users.length === 0) {
      return { success: false, message: "Invalid username or password" }
    }

    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return { success: false, message: "Invalid username or password" }
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET)

    // Set cookie
    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    })

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An error occurred during login" }
  }
}

// Register function (admin only)
export async function register(
  username: string,
  password: string,
  role: "admin" | "staff",
): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if username already exists
    const checkQuery = "SELECT id FROM users WHERE username = ?"
    const existingUsers = await executeQuery<any[]>({ query: checkQuery, values: [username] })

    if (existingUsers.length > 0) {
      return { success: false, message: "Username already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    const insertQuery = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    await executeQuery({ query: insertQuery, values: [username, hashedPassword, role] })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, message: "An error occurred during registration" }
  }
}

// Get current user from cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = cookies().get("auth-token")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as "admin" | "staff",
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

// Logout function
export function logout() {
  cookies().delete("auth-token")
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "admin"
}
