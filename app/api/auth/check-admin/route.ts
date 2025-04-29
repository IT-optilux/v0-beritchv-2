import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    try {
      // Verificar el token con Firebase Admin
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

      // Verificar si el usuario es administrador
      const userRecord = await auth.getUser(decodedClaims.uid)
      const customClaims = userRecord.customClaims || {}

      // Comprobar si el usuario tiene el rol de administrador
      const isAdmin = customClaims.role === "admin"

      return NextResponse.json({ isAdmin })
    } catch (firebaseError) {
      console.error("Error de Firebase:", firebaseError)
      return NextResponse.json({ isAdmin: false, error: "Error de autenticación" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error verificando permisos de administrador:", error)
    return NextResponse.json({ isAdmin: false, error: "Error del servidor" }, { status: 500 })
  }
}
