export type UserRole = "admin" | "supervisor" | "tecnico" | "operador" | "invitado"

export interface User {
  uid: string
  email: string
  displayName?: string
  firstName?: string
  lastName?: string
  role: UserRole
  isActive: boolean
  lastLogin?: string
  createdAt: string
  photoURL?: string
}

export interface UserFormData {
  uid?: string
  email: string
  firstName?: string
  lastName?: string
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

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["all"],
  supervisor: ["view_all", "edit_reports", "view_analytics", "manage_maintenance"],
  tecnico: ["view_machines", "edit_machines", "view_reports", "edit_reports", "manage_maintenance"],
  operador: ["view_machines", "view_reports", "create_reports", "view_inventory"],
  invitado: ["view_basic"],
}
