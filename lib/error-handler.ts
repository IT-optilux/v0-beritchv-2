export type ErrorResponse = {
  success: false
  message: string
  code?: string
  details?: any
}

export type SuccessResponse<T = any> = {
  success: true
  data: T
  message?: string
}

export type ApiResponse<T = any> = ErrorResponse | SuccessResponse<T>

/**
 * Maneja errores en acciones del servidor de manera consistente
 */
export function handleServerError(error: unknown, context: string): ErrorResponse {
  console.error(`Error en ${context}:`, error)

  if (error instanceof Error) {
    return {
      success: false,
      message: `Error en ${context}: ${error.message}`,
      code: "SERVER_ERROR",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }
  }

  return {
    success: false,
    message: `Error desconocido en ${context}`,
    code: "UNKNOWN_ERROR",
  }
}

/**
 * Wrapper para acciones del servidor que maneja errores automáticamente
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
): (...args: Parameters<T>) => Promise<ApiResponse<Awaited<ReturnType<T>>>> {
  return async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return handleServerError(error, context)
    }
  }
}
