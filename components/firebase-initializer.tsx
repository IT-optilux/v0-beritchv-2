"use client"

import { useEffect, useState } from "react"
import { firebase } from "@/lib/firebase-client"
import { useToast } from "@/hooks/use-toast"

export function FirebaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkFirebaseInitialization = () => {
      if (firebase && firebase.initialized) {
        console.log("Firebase inicializado correctamente")
        setInitialized(true)
      } else {
        console.error("Firebase no se inicializó correctamente")
        toast({
          title: "Error de inicialización",
          description: "No se pudo inicializar Firebase. Algunas funciones pueden no estar disponibles.",
          variant: "destructive",
        })
      }
    }

    // Verificar después de un breve retraso para dar tiempo a la inicialización
    const timer = setTimeout(checkFirebaseInitialization, 1000)

    return () => clearTimeout(timer)
  }, [toast])

  return null
}
