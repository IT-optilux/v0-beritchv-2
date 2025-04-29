import { cookies } from "next/headers"
import { auth } from "@/lib/firebase-admin"
import type { User } from "@/types/users"
import { ROLE_PERMISSIONS } from "@/types/users"

// Función para verificar la sesión del usuario actual
export async function getCurrentUser(): Promise<User | null> {
  const sessionCookie = cookies().get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const userRecord = await auth.getUser(decodedClaims.uid)

    // Obtener datos adicionales de Firestore si es necesario
    // En este caso simplificado, solo usamos los datos de Auth
    return {
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      firstName: decodedClaims.firstName || "",
      lastName: decodedClaims.lastName || "",
      role: decodedClaims.role || "invitado",
      isActive: !userRecord.disabled,
      lastLogin: userRecord.metadata.lastSignInTime || "",
      createdAt: userRecord.metadata.creationTime || "",
      photoURL: userRecord.photoURL || "",
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error)
    return null
  }
}

// Función para verificar si un usuario es administrador
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false
  return user.role === "admin"
}

// Función para verificar si un usuario tiene un permiso específico
export async function hasPermission(user: User | null, permission: string): Promise<boolean> {
  if (!user) return false

  // Los administradores tienen todos los permisos
  if (user.role === "admin") return true

  // Verificar si el rol del usuario tiene el permiso específico
  return ROLE_PERMISSIONS[user.role]?.includes(permission) || ROLE_PERMISSIONS[user.role]?.includes("all") || false
}
