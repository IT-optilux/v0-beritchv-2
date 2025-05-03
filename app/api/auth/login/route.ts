import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ success: false, message: "No ID token provided" }, { status: 400 })
    }

    // Crear una cookie de sesión
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 días
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    // Configurar la cookie
    cookies().set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return NextResponse.json({ success: true, message: "Logged in successfully" })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ success: false, message: "Failed to log in" }, { status: 401 })
  }
}
