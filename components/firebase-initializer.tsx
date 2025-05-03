"use client"

import { useEffect, useState } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { useToast } from "@/hooks/use-toast"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function FirebaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    try {
      // Inicializar Firebase
      const app = initializeApp(firebaseConfig)
      const firestore = getFirestore(app)
      const auth = getAuth(app)
      const storage = getStorage(app)

      // Configurar emuladores si es necesario
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
        const { connectFirestoreEmulator } = require("firebase/firestore")
        const { connectAuthEmulator } = require("firebase/auth")
        const { connectStorageEmulator } = require("firebase/storage")

        connectFirestoreEmulator(firestore, "localhost", 8080)
        connectAuthEmulator(auth, "http://localhost:9099")
        connectStorageEmulator(storage, "localhost", 9199)
      }

      setInitialized(true)
      console.log("Firebase initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      toast({
        title: "Error",
        description: "No se pudo inicializar Firebase",
        variant: "destructive",
      })
    }
  }, [toast])

  return null
}
