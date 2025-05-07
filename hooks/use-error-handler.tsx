"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleError = useCallback(
    (error: any, customMessage?: string) => {
      console.error("Error capturado:", error)

      const errorMessage = customMessage || error?.message || "Ha ocurrido un error inesperado"
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      setIsLoading(false)
    },
    [toast],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(
    <T extends (...args: any[]) => Promise<any>>(fn: T, customErrorMessage?: string) => {
      return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
        try {
          setIsLoading(true)
          clearError()
          const result = await fn(...args)
          setIsLoading(false)
          return result
        } catch (error) {
          handleError(error, customErrorMessage)
          return null
        }
      }
    },
    [handleError, clearError],
  )

  return {
    error,
    isLoading,
    setIsLoading,
    handleError,
    clearError,
    withErrorHandling,
  }
}
