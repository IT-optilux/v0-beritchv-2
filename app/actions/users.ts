"use server"

import { revalidatePath } from "next/cache"
import type { User, UserRole } from "@/types/users"

// Simulación de base de datos
let users: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@beritchoptilab.com",
    firstName: "Administrador",
    lastName: "Sistema",
    role: "admin",
    isActive: true,
    lastLogin: "2023-04-15T10:30:00",
    createdAt: "2023-01-01T00:00:00",
    avatar: "/images/avatars/admin.png",
  },
  {
    id: 2,
    username: "supervisor",
    email: "supervisor@beritchoptilab.com",
    firstName: "Juan",
    lastName: "Pérez",
    role: "supervisor",
    isActive: true,
    lastLogin: "2023-04-14T15:45:00",
    createdAt: "2023-01-15T00:00:00",
  },
  {
    id: 3,
    username: "tecnico1",
    email: "tecnico1@beritchoptilab.com",
    firstName: "María",
    lastName: "López",
    role: "tecnico",
    isActive: true,
    lastLogin: "2023-04-15T08:20:00",
    createdAt: "2023-02-01T00:00:00",
  },
  {
    id: 4,
    username: "operador1",
    email: "operador1@beritchoptilab.com",
    firstName: "Carlos",
    lastName: "Rodríguez",
    role: "operador",
    isActive: true,
    lastLogin: "2023-04-14T12:10:00",
    createdAt: "2023-02-15T00:00:00",
  },
  {
    id: 5,
    username: "invitado",
    email: "invitado@beritchoptilab.com",
    firstName: "Ana",
    lastName: "Martínez",
    role: "invitado",
    isActive: false,
    createdAt: "2023-03-01T00:00:00",
  },
]

// Función de utilidad para manejar errores
const handleActionError = (error: unknown, message: string) => {
  console.error(`${message}:`, error)
  return {
    success: false,
    message: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
  }
}

export async function getUsers() {
  try {
    return users
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

export async function getUserById(id: number) {
  try {
    return users.find((user) => user.id === id)
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${id}:`, error)
    return null
  }
}

export async function getUserByUsername(username: string) {
  try {
    return users.find((user) => user.username === username)
  } catch (error) {
    console.error(`Error al obtener usuario con nombre de usuario ${username}:`, error)
    return null
  }
}

export async function createUser(formData: FormData) {
  try {
    // Validar que el usuario tenga permisos de administrador
    // En una implementación real, esto se haría con un middleware de autenticación

    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const role = formData.get("role") as UserRole

    // Validaciones básicas
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return { success: false, message: "Todos los campos son obligatorios" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Las contraseñas no coinciden" }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: "El formato del correo electrónico no es válido" }
    }

    // Verificar si el usuario ya existe
    if (users.some((user) => user.username === username)) {
      return { success: false, message: "El nombre de usuario ya está en uso" }
    }

    if (users.some((user) => user.email === email)) {
      return { success: false, message: "El correo electrónico ya está en uso" }
    }

    const newUser: User = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      username,
      email,
      firstName,
      lastName,
      role,
      isActive: formData.get("isActive") === "true",
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario creado exitosamente", user: newUser }
  } catch (error) {
    return handleActionError(error, "Error al crear usuario")
  }
}

export async function updateUser(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const index = users.findIndex((user) => user.id === id)

    if (index === -1) {
      return { success: false, message: "Usuario no encontrado" }
    }

    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const role = formData.get("role") as UserRole

    // Validaciones básicas
    if (!username || !email || !firstName || !lastName || !role) {
      return { success: false, message: "Todos los campos son obligatorios" }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: "El formato del correo electrónico no es válido" }
    }

    // Verificar si el nombre de usuario ya está en uso por otro usuario
    if (users.some((user) => user.username === username && user.id !== id)) {
      return { success: false, message: "El nombre de usuario ya está en uso" }
    }

    // Verificar si el correo electrónico ya está en uso por otro usuario
    if (users.some((user) => user.email === email && user.id !== id)) {
      return { success: false, message: "El correo electrónico ya está en uso" }
    }

    const updatedUser: User = {
      ...users[index],
      username,
      email,
      firstName,
      lastName,
      role,
      isActive: formData.get("isActive") === "true",
    }

    // Si se proporciona una nueva contraseña, actualizarla
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password) {
      if (password !== confirmPassword) {
        return { success: false, message: "Las contraseñas no coinciden" }
      }
      // En una implementación real, aquí se cifraría la contraseña
    }

    users[index] = updatedUser
    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario actualizado exitosamente", user: updatedUser }
  } catch (error) {
    return handleActionError(error, "Error al actualizar usuario")
  }
}

export async function deleteUser(id: number) {
  try {
    // No permitir eliminar al usuario administrador principal
    if (id === 1) {
      return { success: false, message: "No se puede eliminar al administrador principal" }
    }

    const initialLength = users.length
    users = users.filter((user) => user.id !== id)

    if (users.length === initialLength) {
      return { success: false, message: "Usuario no encontrado" }
    }

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario eliminado exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al eliminar usuario")
  }
}

export async function toggleUserStatus(id: number) {
  try {
    const index = users.findIndex((user) => user.id === id)

    if (index === -1) {
      return { success: false, message: "Usuario no encontrado" }
    }

    // No permitir desactivar al usuario administrador principal
    if (id === 1 && users[index].isActive) {
      return { success: false, message: "No se puede desactivar al administrador principal" }
    }

    users[index] = {
      ...users[index],
      isActive: !users[index].isActive,
    }

    revalidatePath("/dashboard/users")
    return { success: true, message: "Estado del usuario actualizado exitosamente", user: users[index] }
  } catch (error) {
    return handleActionError(error, "Error al cambiar estado del usuario")
  }
}

// Función para simular el inicio de sesión
export async function loginUser(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    if (!username || !password) {
      return { success: false, message: "Nombre de usuario y contraseña son requeridos" }
    }

    // En una implementación real, aquí se verificaría la contraseña cifrada
    const user = users.find((u) => u.username === username)

    if (!user) {
      return { success: false, message: "Credenciales inválidas" }
    }

    if (!user.isActive) {
      return { success: false, message: "Usuario desactivado. Contacte al administrador" }
    }

    // Actualizar la fecha de último inicio de sesión
    const index = users.findIndex((u) => u.id === user.id)
    users[index] = {
      ...users[index],
      lastLogin: new Date().toISOString(),
    }

    // En una implementación real, aquí se generaría un token JWT o una sesión
    return { success: true, message: "Inicio de sesión exitoso", user }
  } catch (error) {
    return handleActionError(error, "Error al iniciar sesión")
  }
}

// Función para verificar si un usuario tiene permisos de administrador
export async function isAdmin(user: User | null): Promise<boolean> {
  try {
    return user?.role === "admin"
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error)
    return false
  }
}

// Función para verificar si un usuario tiene permisos para una acción específica
export async function hasPermission(user: User | null, action: string): Promise<boolean> {
  try {
    if (!user) return false

    // Definir permisos por rol
    const permissions: Record<UserRole, string[]> = {
      admin: ["all"], // El administrador tiene todos los permisos
      supervisor: ["view_all", "edit_reports", "view_analytics"],
      tecnico: ["view_machines", "edit_machines", "view_reports", "edit_reports"],
      operador: ["view_machines", "view_reports", "create_reports"],
      invitado: ["view_basic"],
    }

    // Si el usuario es administrador o tiene el permiso específico
    return user.role === "admin" || permissions[user.role].includes(action) || permissions[user.role].includes("all")
  } catch (error) {
    console.error(`Error al verificar permiso ${action}:`, error)
    return false
  }
}
