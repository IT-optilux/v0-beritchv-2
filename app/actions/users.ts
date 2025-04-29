"use server"

import { revalidatePath } from "next/cache"
import { auth, firestore } from "@/lib/firebase-admin"
import type { UserRecord } from "firebase-admin/auth"
import type { User, UserRole } from "@/types/users"
import { isAdmin } from "@/lib/auth-utils"
import { cookies } from "next/headers"

// Función de utilidad para manejar errores
const handleActionError = (error: unknown, message: string) => {
  console.error(`${message}:`, error)
  return {
    success: false,
    message: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
  }
}

// Función para convertir UserRecord a nuestro tipo User
const userRecordToUser = async (userRecord: UserRecord): Promise<User> => {
  // Obtener datos adicionales de Firestore
  const userDoc = await firestore.collection("users").doc(userRecord.uid).get()
  const userData = userDoc.exists ? userDoc.data() : {}

  return {
    uid: userRecord.uid,
    email: userRecord.email || "",
    displayName: userRecord.displayName || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    role: (userData?.role || userRecord.customClaims?.role || "invitado") as UserRole,
    isActive: userRecord.disabled !== true,
    lastLogin: userRecord.metadata.lastSignInTime || "",
    createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
    photoURL: userRecord.photoURL || "",
  }
}

// Verificar si el usuario actual es administrador
const verifyAdminAccess = async () => {
  const sessionCookie = cookies().get("session")?.value

  if (!sessionCookie) {
    return {
      success: false,
      message: "No tiene permisos para realizar esta acción",
    }
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const userRecord = await auth.getUser(decodedClaims.uid)
    const user = await userRecordToUser(userRecord)

    if (!(await isAdmin(user))) {
      return {
        success: false,
        message: "Solo los administradores pueden gestionar usuarios",
      }
    }

    return { success: true }
  } catch (error) {
    return handleActionError(error, "Error al verificar permisos de administrador")
  }
}

// Obtener todos los usuarios
export async function getUsers() {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return []
    }

    // Obtener todos los usuarios de Firebase Auth
    const listUsersResult = await auth.listUsers()

    // Convertir a nuestro tipo User
    const users = await Promise.all(listUsersResult.users.map((userRecord) => userRecordToUser(userRecord)))

    return users
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

// Obtener un usuario por ID
export async function getUserById(uid: string) {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return null
    }

    const userRecord = await auth.getUser(uid)
    return await userRecordToUser(userRecord)
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${uid}:`, error)
    return null
  }
}

// Crear un nuevo usuario
export async function createUser(formData: FormData) {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const role = formData.get("role") as UserRole
    const isActive = formData.get("isActive") === "true"

    // Validaciones básicas
    if (!email || !password) {
      return { success: false, message: "Email y contraseña son obligatorios" }
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
      disabled: !isActive,
    })

    // Establecer claims personalizados para roles
    await auth.setCustomUserClaims(userRecord.uid, { role })

    // Guardar datos adicionales en Firestore
    await firestore.collection("users").doc(userRecord.uid).set({
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
    })

    revalidatePath("/dashboard/users")
    return {
      success: true,
      message: "Usuario creado exitosamente",
      user: await userRecordToUser(userRecord),
    }
  } catch (error) {
    return handleActionError(error, "Error al crear usuario")
  }
}

// Actualizar un usuario existente
export async function updateUser(formData: FormData) {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const uid = formData.get("uid") as string
    const email = formData.get("email") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const role = formData.get("role") as UserRole
    const isActive = formData.get("isActive") === "true"
    const password = formData.get("password") as string

    if (!uid) {
      return { success: false, message: "ID de usuario no proporcionado" }
    }

    // Preparar datos para actualizar en Firebase Auth
    const updateAuthData: any = {
      email,
      displayName: `${firstName} ${lastName}`.trim(),
      disabled: !isActive,
    }

    // Si se proporciona una nueva contraseña, actualizarla
    if (password) {
      updateAuthData.password = password
    }

    // Actualizar usuario en Firebase Auth
    await auth.updateUser(uid, updateAuthData)

    // Actualizar claims personalizados para roles
    await auth.setCustomUserClaims(uid, { role })

    // Actualizar datos adicionales en Firestore
    await firestore.collection("users").doc(uid).update({
      firstName,
      lastName,
      role,
      updatedAt: new Date().toISOString(),
    })

    revalidatePath("/dashboard/users")

    const updatedUser = await auth.getUser(uid)
    return {
      success: true,
      message: "Usuario actualizado exitosamente",
      user: await userRecordToUser(updatedUser),
    }
  } catch (error) {
    return handleActionError(error, "Error al actualizar usuario")
  }
}

// Eliminar un usuario
export async function deleteUser(uid: string) {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    // No permitir eliminar al usuario que está realizando la acción
    const sessionCookie = cookies().get("session")?.value
    const decodedClaims = await auth.verifySessionCookie(sessionCookie!, true)

    if (decodedClaims.uid === uid) {
      return { success: false, message: "No puede eliminar su propia cuenta" }
    }

    // Eliminar usuario de Firebase Auth
    await auth.deleteUser(uid)

    // Eliminar datos adicionales de Firestore
    await firestore.collection("users").doc(uid).delete()

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario eliminado exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al eliminar usuario")
  }
}

// Cambiar el estado de un usuario (activar/desactivar)
export async function toggleUserStatus(uid: string) {
  try {
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    // No permitir desactivar al usuario que está realizando la acción
    const sessionCookie = cookies().get("session")?.value
    const decodedClaims = await auth.verifySessionCookie(sessionCookie!, true)

    if (decodedClaims.uid === uid) {
      return { success: false, message: "No puede desactivar su propia cuenta" }
    }

    // Obtener usuario actual
    const userRecord = await auth.getUser(uid)

    // Cambiar estado
    await auth.updateUser(uid, {
      disabled: !userRecord.disabled,
    })

    // Actualizar en Firestore
    await firestore.collection("users").doc(uid).update({
      isActive: !userRecord.disabled,
      updatedAt: new Date().toISOString(),
    })

    revalidatePath("/dashboard/users")

    const updatedUser = await auth.getUser(uid)
    return {
      success: true,
      message: `Usuario ${userRecord.disabled ? "activado" : "desactivado"} exitosamente`,
      user: await userRecordToUser(updatedUser),
    }
  } catch (error) {
    return handleActionError(error, "Error al cambiar estado del usuario")
  }
}
