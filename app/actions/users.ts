"use server"

import { auth, db } from "@/lib/firebase-admin"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { handleError } from "@/lib/error-handler"

// Verificar si el usuario actual es administrador
async function isAdmin() {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return false
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true).catch(() => null)

    if (!decodedClaims) {
      return false
    }

    const userRecord = await auth.getUser(decodedClaims.uid).catch(() => null)

    if (!userRecord) {
      return false
    }

    const customClaims = userRecord.customClaims || {}
    return customClaims.role === "admin"
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error)
    return false
  }
}

// Obtener todos los usuarios
export async function getUsers() {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    // Obtener usuarios de Firebase Auth
    const listUsersResult = await auth.listUsers()
    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      role: user.customClaims?.role || "invitado",
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    }))

    return { success: true, users }
  } catch (error) {
    return handleError(error, "Error al obtener usuarios")
  }
}

// Crear un nuevo usuario
export async function createUser(formData: FormData) {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const displayName = formData.get("displayName") as string
    const role = formData.get("role") as string

    // Validar datos
    if (!email || !password || !displayName || !role) {
      return { success: false, error: "Todos los campos son obligatorios" }
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: false,
    })

    // Asignar rol mediante custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role })

    // Guardar información adicional en Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario creado correctamente" }
  } catch (error) {
    return handleError(error, "Error al crear usuario")
  }
}

// Actualizar un usuario existente
export async function updateUser(formData: FormData) {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    const uid = formData.get("uid") as string
    const displayName = formData.get("displayName") as string
    const role = formData.get("role") as string
    const disabled = formData.get("disabled") === "true"

    // Validar datos
    if (!uid || !displayName || !role) {
      return { success: false, error: "Faltan campos obligatorios" }
    }

    // Actualizar usuario en Firebase Auth
    await auth.updateUser(uid, {
      displayName,
      disabled,
    })

    // Actualizar rol mediante custom claims
    await auth.setCustomUserClaims(uid, { role })

    // Actualizar información en Firestore
    await db.collection("users").doc(uid).update({
      displayName,
      role,
      disabled,
      updatedAt: new Date(),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario actualizado correctamente" }
  } catch (error) {
    return handleError(error, "Error al actualizar usuario")
  }
}

// Eliminar un usuario
export async function deleteUser(formData: FormData) {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    const uid = formData.get("uid") as string

    // Validar datos
    if (!uid) {
      return { success: false, error: "ID de usuario no proporcionado" }
    }

    // Verificar que no se está eliminando al propio administrador
    const sessionCookie = cookies().get("session")?.value
    if (sessionCookie) {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
      if (decodedClaims.uid === uid) {
        return { success: false, error: "No puedes eliminar tu propia cuenta" }
      }
    }

    // Eliminar usuario de Firebase Auth
    await auth.deleteUser(uid)

    // Eliminar información de Firestore
    await db.collection("users").doc(uid).delete()

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario eliminado correctamente" }
  } catch (error) {
    return handleError(error, "Error al eliminar usuario")
  }
}

// Cambiar contraseña de usuario
export async function changePassword(formData: FormData) {
  try {
    // Verificar si el usuario es administrador
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    const uid = formData.get("uid") as string
    const newPassword = formData.get("password") as string

    // Validar datos
    if (!uid || !newPassword) {
      return { success: false, error: "Faltan campos obligatorios" }
    }

    // Actualizar contraseña en Firebase Auth
    await auth.updateUser(uid, {
      password: newPassword,
    })

    return { success: true, message: "Contraseña actualizada correctamente" }
  } catch (error) {
    return handleError(error, "Error al cambiar contraseña")
  }
}
