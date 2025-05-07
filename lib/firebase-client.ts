"use client"

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"
import { getAnalytics, isSupported } from "firebase/analytics"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Inicializar Firebase solo una vez
let app
let firestore
let auth
let storage
let database
let analytics

if (typeof window !== "undefined") {
  try {
    // Verificar si ya existe una instancia
    if (getApps().length === 0) {
      console.log("Inicializando Firebase por primera vez")
      app = initializeApp(firebaseConfig)
    } else {
      console.log("Usando instancia existente de Firebase")
      app = getApps()[0]
    }

    // Inicializar servicios
    firestore = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)

    if (firebaseConfig.databaseURL) {
      database = getDatabase(app)
    }

    // Configurar persistencia para Firestore
    if (firestore) {
      enableIndexedDbPersistence(firestore)
        .then(() => console.log("Persistencia de Firestore habilitada"))
        .catch((err) => {
          if (err.code === "failed-precondition") {
            console.warn("La persistencia de Firestore no pudo ser habilitada porque múltiples pestañas están abiertas")
          } else if (err.code === "unimplemented") {
            console.warn("El navegador actual no soporta persistencia de Firestore")
          }
        })
    }

    // Configurar persistencia para Auth
    if (auth) {
      setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("Persistencia de Auth habilitada"))
        .catch((error) => {
          console.error("Error al configurar persistencia de Auth:", error)
        })
    }

    // Analytics solo en cliente y si es compatible
    if (typeof window !== "undefined") {
      isSupported()
        .then((supported) => {
          if (supported) {
            analytics = getAnalytics(app)
            console.log("Analytics inicializado")
          }
        })
        .catch((err) => {
          console.warn("Error al verificar soporte para Analytics:", err)
        })
    }

    console.log("Firebase inicializado correctamente")
  } catch (error) {
    console.error("Error al inicializar Firebase:", error)
  }
}

// Función para verificar si Firebase está inicializado
export function isFirebaseInitialized() {
  return !!app && !!firestore && !!auth
}

// Exportar las instancias
export { app, firestore, auth, storage, database, analytics }
export const db = firestore // Alias para compatibilidad

// Exportar objeto firebase para compatibilidad con código existente
export const firebase = {
  app,
  firestore,
  auth,
  storage,
  database,
  analytics,
  initialized: isFirebaseInitialized(),
}
