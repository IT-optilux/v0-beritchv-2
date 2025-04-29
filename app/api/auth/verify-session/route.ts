import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, message: "No session cookie found" }, { status: 401 })
    }

    // Verificar el token con Firebase Admin
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    // Devolver información básica del usuario
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        emailVerified: decodedClaims.email_verified,
        // No incluimos información de roles ya que eliminamos el módulo de usuarios
      },
    })
  } catch (error) {
    console.error("Error verifying session:", error)
    return NextResponse.json({ authenticated: false, message: "Invalid session" }, { status: 401 })
  }
}
