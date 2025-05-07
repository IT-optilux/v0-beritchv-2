"use client"

import { useEffect, useState } from "react"
import { isFirebaseInitialized } from "@/lib/firebase-client"
import { useToast } from "@/hooks/use-toast"

export function FirebaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      return
    }

    // Verificar si Firebase está inicializado
    if (isFirebaseInitialized()) {
      console.log("Firebase verificado correctamente")
      setInitialized(true)
      return
    }

    // Si no está inicializado, mostrar un error
    console.error("Firebase no está inicializado correctamente")
    toast({
      title: "Error de conexión",
      description: "No se pudo conectar con la base de datos. Algunas funciones pueden no estar disponibles.",
      variant: "destructive",
    })
  }, [toast])

  return null
}

export default FirebaseInitializer
