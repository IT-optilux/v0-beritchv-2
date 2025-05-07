"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

type OperationType = "create" | "update" | "delete"
type EntityType = "inventory" | "machine" | "maintenance" | "report" | "user"

interface PendingOperation {
  id: string
  type: OperationType
  entityType: EntityType
  data: any
  timestamp: number
}

export function useOfflineOperations() {
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([])
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const { toast } = useToast()

  // Cargar operaciones pendientes del localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedOperations = localStorage.getItem("pendingOperations")
      if (storedOperations) {
        setPendingOperations(JSON.parse(storedOperations))
      }
    } catch (error) {
      console.error("Error al cargar operaciones pendientes:", error)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Guardar operaciones pendientes en localStorage cuando cambien
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("pendingOperations", JSON.stringify(pendingOperations))
    } catch (error) {
      console.error("Error al guardar operaciones pendientes:", error)
    }
  }, [pendingOperations])

  // Añadir una operación pendiente
  const addPendingOperation = useCallback(
    (type: OperationType, entityType: EntityType, data: any) => {
      const operation: PendingOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        entityType,
        data,
        timestamp: Date.now(),
      }

      setPendingOperations((prev) => [...prev, operation])

      toast({
        title: "Operación en modo offline",
        description: "La operación se sincronizará cuando vuelvas a estar en línea",
        variant: "default",
      })

      return operation.id
    },
    [toast],
  )

  // Remover una operación pendiente
  const removePendingOperation = useCallback((id: string) => {
    setPendingOperations((prev) => prev.filter((op) => op.id !== id))
  }, [])

  // Ejecutar una operación con soporte offline
  const executeOperation = useCallback(async <T>(\
    onlineFunction: () => Promise<T>,
    type: OperationType,
    entityType: EntityType,
    data: any
  ): Promise<T | string> => {
  if (isOnline) {
    try {
      return await onlineFunction()
    } catch (error) {
      console.error("Error al ejecutar operación online:", error)
      const operationId = addPendingOperation(type, entityType, data)
      return operationId
    }
  } else {
    const operationId = addPendingOperation(type, entityType, data)
    return operationId
  }
}
, [isOnline, addPendingOperation])

return {
    pendingOperations,
    isOnline,
    addPendingOperation,
    removePendingOperation,
    executeOperation
  }
}
