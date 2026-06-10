import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

function withPathnameHeader(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public API routes (non-admin)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next()
  }

  // Allow access to login page
  if (pathname === "/admin/login") {
    return withPathnameHeader(request, pathname)
  }

  // Protect all /admin routes (including /admin API routes)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = await auth()

    // If no session, redirect to login (for pages) or return 401 (for API)
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If user is not an admin, redirect to home (for pages) or return 403 (for API)
    if (session.user?.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return withPathnameHeader(request, pathname)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
