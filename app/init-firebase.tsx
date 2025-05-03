"use client"

import { useEffect, useState } from "react"
import { initializeFirestoreData } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase-client"

export function InitFirebase() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkAndInitializeFirebase = async () => {
      try {
        // Verificar si Firebase está inicializado
        if (!firebase || !firebase.initialized) {
          console.error("Firebase no está inicializado correctamente")
          return
        }

        // Verificar si los datos ya están inicializados
        const isInitialized = localStorage.getItem("firebase-initialized") === "true"

        if (!isInitialized) {
          // Inicializar datos de Firestore
          await initializeFirestoreData()

          // Establecer bandera en localStorage
          localStorage.setItem("firebase-initialized", "true")

          toast({
            title: "Inicialización completada",
            description: "La base de datos se ha inicializado con datos de ejemplo",
          })
        }

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing Firebase data:", error)
        toast({
          title: "Error",
          description: "No se pudo inicializar la base de datos",
          variant: "destructive",
        })
      }
    }

    // Verificar después de un breve retraso para dar tiempo a la inicialización de Firebase
    const timer = setTimeout(checkAndInitializeFirebase, 2000)

    return () => clearTimeout(timer)
  }, [toast])

  return null
}
