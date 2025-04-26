export type UserRole = "admin" | "supervisor" | "tecnico" | "operador" | "invitado"

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  lastLogin?: string
  createdAt: string
  avatar?: string
}

export interface UserFormData {
  id?: number
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  password?: string
  confirmPassword?: string
  isActive: boolean
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Acceso completo a todas las funciones del sistema",
  supervisor: "Gestión de reportes y visualización de estadísticas",
  tecnico: "Gestión de equipos y mantenimientos",
  operador: "Operación básica de equipos y reportes",
  invitado: "Solo visualización de información básica",
}
