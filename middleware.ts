import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth-server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/api/auth/login"

  // Define API paths to exclude from middleware
  const isApiPath = path.startsWith("/api/")

  // Skip middleware for API routes to prevent circular dependencies
  if (isApiPath) {
    return NextResponse.next()
  }

  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value || ""

  // If the path is not public and there's no token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login and there's a token, verify it and redirect to dashboard if valid
  if (isPublicPath && token) {
    const user = await verifyToken(token)
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js internals)
     * 2. /fonts, /images (static files)
     * 3. /favicon.ico, /logo.svg (static files)
     */
    "/((?!_next|fonts|images|favicon.ico|logo.svg).*)",
  ],
}
