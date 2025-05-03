import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ isAdmin: false })
    }

    // Verificar el token con Firebase Admin
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    // Obtener el usuario y sus claims
    const userRecord = await auth.getUser(decodedClaims.uid)
    const customClaims = userRecord.customClaims || {}

    // Verificar si el usuario tiene rol de administrador
    const isAdmin = customClaims.role === "admin"

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error)
    return NextResponse.json({ isAdmin: false })
  }
}
