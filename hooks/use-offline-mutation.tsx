"use client"

import { useEffect } from "react"

import { useState, useCallback } from "react"
import { useConnection } from "@/lib/connection-context"
import { useToast } from "@/hooks/use-toast"

type MutationState<T> = {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
  data: T | null
}

type MutationOptions<T> = {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  optimisticUpdate?: boolean
}

export function useOfflineMutation<T, P>(mutationFn: (params: P) => Promise<T>, options: MutationOptions<T> = {}) {
  const [state, setState] = useState<MutationState<T>>({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  })
  const { isOnline, firestoreConnected } = useConnection()
  const { toast } = useToast()
  const [pendingOperations, setPendingOperations] = useState<Array<{ params: P; timestamp: number }>>([])

  // Cargar operaciones pendientes del localStorage
  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem("pendingOperations")
      if (stored) {
        setPendingOperations(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error al cargar operaciones pendientes:", error)
    }
  }, [])

  // Guardar operaciones pendientes en localStorage
  const savePendingOperations = useCallback((operations: Array<{ params: P; timestamp: number }>) => {
    try {
      localStorage.setItem("pendingOperations", JSON.stringify(operations))
    } catch (error) {
      console.error("Error al guardar operaciones pendientes:", error)
    }
  }, [])

  // Ejecutar una operación
  const mutate = useCallback(
    async (params: P) => {
      setState({ isLoading: true, isError: false, isSuccess: false, error: null, data: null })

      // Si estamos online y conectados a Firestore, ejecutar la operación normalmente
      if (isOnline && firestoreConnected) {
        try {
          const result = await mutationFn(params)
          setState({ isLoading: false, isError: false, isSuccess: true, error: null, data: result })
          options.onSuccess?.(result)
          options.onSettled?.()
          return result
        } catch (error: any) {
          setState({ isLoading: false, isError: true, isSuccess: false, error, data: null })
          options.onError?.(error)
          options.onSettled?.()
          throw error
        }
      } else {
        // Si estamos offline, guardar la operación para ejecutarla más tarde
        const newOperation = { params, timestamp: Date.now() }
        const updatedOperations = [...pendingOperations, newOperation]
        setPendingOperations(updatedOperations)
        savePendingOperations(updatedOperations)

        toast({
          title: "Modo sin conexión",
          description: "La operación se realizará cuando se restablezca la conexión.",
          variant: "default",
        })

        setState({ isLoading: false, isError: false, isSuccess: true, error: null, data: null })
        options.onSettled?.()
        return null
      }
    },
    [isOnline, firestoreConnected, mutationFn, options, pendingOperations, savePendingOperations, toast],
  )

  // Procesar operaciones pendientes cuando volvemos a estar online
  const processPendingOperations = useCallback(async () => {
    if (!isOnline || !firestoreConnected || pendingOperations.length === 0) return

    toast({
      title: "Sincronizando",
      description: `Procesando ${pendingOperations.length} operaciones pendientes...`,
      variant: "default",
    })

    const failedOperations = []

    for (const operation of pendingOperations) {
      try {
        await mutationFn(operation.params)
      } catch (error) {
        console.error("Error al procesar operación pendiente:", error)
        failedOperations.push(operation)
      }
    }

    if (failedOperations.length > 0) {
      setPendingOperations(failedOperations)
      savePendingOperations(failedOperations)
      toast({
        title: "Sincronización parcial",
        description: `${pendingOperations.length - failedOperations.length} operaciones completadas, ${
          failedOperations.length
        } fallidas.`,
        variant: "destructive",
      })
    } else {
      setPendingOperations([])
      savePendingOperations([])
      toast({
        title: "Sincronización completa",
        description: `${pendingOperations.length} operaciones completadas con éxito.`,
        variant: "default",
      })
    }
  }, [isOnline, firestoreConnected, pendingOperations, mutationFn, savePendingOperations, toast])

  // Efecto para procesar operaciones pendientes cuando volvemos a estar online
  useEffect(() => {
    if (isOnline && firestoreConnected) {
      processPendingOperations()
    }
  }, [isOnline, firestoreConnected, processPendingOperations])

  // Efecto para cargar operaciones pendientes al montar el componente
  useEffect(() => {
    loadPendingOperations()
  }, [loadPendingOperations])

  return {
    ...state,
    mutate,
    pendingOperations,
    processPendingOperations,
  }
}
