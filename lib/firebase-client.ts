import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getStorage, connectStorageEmulator } from "firebase/storage"

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

// Inicializar Firebase de manera segura
let app
let firestore
let auth
let storage
let db

// Verificar que estamos en el cliente antes de inicializar Firebase
if (typeof window !== "undefined") {
  try {
    // Inicializar la app de Firebase
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

    // Inicializar servicios
    firestore = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)

    // Alias para mantener compatibilidad
    db = firestore

    // Configurar emuladores solo en desarrollo y en el cliente
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
      try {
        connectFirestoreEmulator(firestore, "localhost", 8080)
        connectAuthEmulator(auth, "http://localhost:9099")
        connectStorageEmulator(storage, "localhost", 9199)
        console.log("Using Firebase emulators")
      } catch (emulatorError) {
        console.error("Error connecting to Firebase emulators:", emulatorError)
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
  }
}

export { app, firestore, auth, storage, db }
