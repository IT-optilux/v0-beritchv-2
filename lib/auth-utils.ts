// Función para verificar si un usuario tiene permisos de administrador
export async function isAdmin(user: any | null): Promise<boolean> {
  try {
    // Implementación simplificada sin el módulo de usuarios
    // En una implementación real, esto verificaría los claims del token de Firebase
    return user?.role === "admin" || user?.admin === true
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error)
    return false
  }
}

// Función para verificar si un usuario tiene permisos para una acción específica
export async function hasPermission(user: any | null, action: string): Promise<boolean> {
  try {
    if (!user) return false

    // Implementación simplificada sin el módulo de usuarios
    // En una implementación real, esto verificaría los claims del token de Firebase

    // Si el usuario es administrador, tiene todos los permisos
    if (user.role === "admin" || user.admin === true) return true

    // Definir permisos básicos por rol
    const permissions: Record<string, string[]> = {
      supervisor: ["view_all", "edit_reports", "view_analytics"],
      tecnico: ["view_machines", "edit_machines", "view_reports", "edit_reports"],
      operador: ["view_machines", "view_reports", "create_reports"],
      invitado: ["view_basic"],
    }

    // Verificar si el usuario tiene el permiso específico
    return permissions[user.role]?.includes(action) || false
  } catch (error) {
    console.error(`Error al verificar permiso ${action}:`, error)
    return false
  }
}
