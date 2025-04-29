import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Eliminar la cookie de sesión
    cookies().delete("session")

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Error logging out:", error)
    return NextResponse.json({ success: false, message: "Failed to log out" }, { status: 500 })
  }
}
