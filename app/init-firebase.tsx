"use client"

import { useEffect, useState } from "react"
import { initializeFirestoreData } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

export function InitFirebase() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkAndInitializeFirebase = async () => {
      try {
        // Check if data is already initialized
        const isInitialized = localStorage.getItem("firebase-initialized") === "true"

        if (!isInitialized) {
          // Initialize Firebase data
          await initializeFirestoreData()

          // Set flag in localStorage
          localStorage.setItem("firebase-initialized", "true")

          toast({
            title: "Inicialización completada",
            description: "La base de datos se ha inicializado con datos de ejemplo",
          })
        }

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        toast({
          title: "Error",
          description: "No se pudo inicializar la base de datos",
          variant: "destructive",
        })
      }
    }

    checkAndInitializeFirebase()
  }, [toast])

  return null
}
