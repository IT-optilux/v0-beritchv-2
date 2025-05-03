"use client"

import { useEffect, useState } from "react"
import { initializeFirestoreData } from "@/lib/firebase-services"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function FirebaseInitializer() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if data is already initialized by looking for a flag in localStorage
    const isDataInitialized = localStorage.getItem("firebase-data-initialized") === "true"
    setIsInitialized(isDataInitialized)
  }, [])

  const handleInitialize = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      await initializeFirestoreData()

      // Set flag in localStorage
      localStorage.setItem("firebase-data-initialized", "true")
      setIsInitialized(true)

      toast({
        title: "Éxito",
        description: "Datos de ejemplo inicializados correctamente",
      })
    } catch (err) {
      console.error("Error initializing data:", err)
      setError("Error al inicializar los datos. Por favor, intenta de nuevo.")

      toast({
        title: "Error",
        description: "No se pudieron inicializar los datos de ejemplo",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  if (isInitialized) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-white p-4 shadow-lg">
      <h3 className="mb-2 text-lg font-medium">Inicializar Datos de Ejemplo</h3>
      <p className="mb-4 text-sm text-gray-600">
        Para probar la aplicación, puedes inicializar la base de datos con datos de ejemplo.
      </p>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button
          onClick={handleInitialize}
          disabled={isInitializing}
          className="bg-optilab-blue hover:bg-optilab-blue/90"
        >
          {isInitializing ? "Inicializando..." : "Inicializar Datos"}
        </Button>
      </div>
    </div>
  )
}
