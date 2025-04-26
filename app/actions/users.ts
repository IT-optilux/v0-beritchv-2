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

export async function getUsers() {
  return users
}

export async function getUserById(id: number) {
  return users.find((user) => user.id === id)
}

export async function getUserByUsername(username: string) {
  return users.find((user) => user.username === username)
}

export async function createUser(formData: FormData) {
  // Validar que el usuario tenga permisos de administrador
  // En una implementación real, esto se haría con un middleware de autenticación

  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validaciones básicas
  if (!username || !email || !password) {
    return { success: false, message: "Todos los campos son obligatorios" }
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Las contraseñas no coinciden" }
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
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    role: formData.get("role") as UserRole,
    isActive: formData.get("isActive") === "true",
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  revalidatePath("/dashboard/users")
  return { success: true, message: "Usuario creado exitosamente", user: newUser }
}

export async function updateUser(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = users.findIndex((user) => user.id === id)

  if (index === -1) {
    return { success: false, message: "Usuario no encontrado" }
  }

  const username = formData.get("username") as string
  const email = formData.get("email") as string

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
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    role: formData.get("role") as UserRole,
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
}

export async function deleteUser(id: number) {
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
}

export async function toggleUserStatus(id: number) {
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
}

// Función para simular el inicio de sesión
export async function loginUser(formData: FormData) {
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
}

// Función para verificar si un usuario tiene permisos de administrador
export async function isAdmin(user: User | null): Promise<boolean> {
  return user?.role === "admin"
}

// Función para verificar si un usuario tiene permisos para una acción específica
export async function hasPermission(user: User | null, action: string): Promise<boolean> {
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
}
