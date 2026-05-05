import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Get current user from database
    const users = await sql`
      SELECT id, email, password
      FROM users
      WHERE id = ${session.user.id}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = users[0] as any

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: "Current user has no password set" },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await sql`
      UPDATE users
      SET password = ${hashedNewPassword}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating password:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    )
  }
}



