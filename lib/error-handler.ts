/**
 * Utility for consistent error handling across the application
 */

// Standard error response type
export interface ErrorResponse {
  success: false
  message: string
  code?: string
  details?: unknown
}

// Success response type
export interface SuccessResponse<T = unknown> {
  success: true
  message: string
  data?: T
}

// Combined response type
export type ApiResponse<T = unknown> = ErrorResponse | SuccessResponse<T>

/**
 * Handles errors consistently across the application
 * @param error The error to handle
 * @param defaultMessage Default message to show if error doesn't have one
 * @returns Standardized error response
 */
export function handleError(error: unknown, defaultMessage = "Ha ocurrido un error inesperado"): ErrorResponse {
  console.error("Error:", error)

  // Firebase errors
  if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
    const firebaseError = error as { code: string; message: string }

    // Map common Firebase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      "auth/email-already-in-use": "El correo electrónico ya está en uso",
      "auth/invalid-email": "El correo electrónico no es válido",
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/weak-password": "La contraseña es demasiado débil",
      "auth/invalid-credential": "Credenciales inválidas",
      "permission-denied": "No tienes permisos para realizar esta acción",
    }

    return {
      success: false,
      message: errorMessages[firebaseError.code] || firebaseError.message,
      code: firebaseError.code,
    }
  }

  // Standard Error objects
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      details: error.stack,
    }
  }

  // String errors
  if (typeof error === "string") {
    return {
      success: false,
      message: error,
    }
  }

  // Default case
  return {
    success: false,
    message: defaultMessage,
    details: error,
  }
}

/**
 * Creates a success response
 * @param message Success message
 * @param data Optional data to include
 * @returns Standardized success response
 */
export function createSuccessResponse<T>(message: string, data?: T): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  }
}
