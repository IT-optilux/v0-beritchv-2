"use client"

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"
import { getAnalytics, isSupported } from "firebase/analytics"

// Configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyAldD9BjpfmEl3GM1uHOO5-ybjqoUUn0Qc",
  authDomain: "beritchv2.firebaseapp.com",
  databaseURL: "https://beritchv2-default-rtdb.firebaseio.com",
  projectId: "beritchv2",
  storageBucket: "beritchv2.appspot.com", // Corregido el dominio del storage
  messagingSenderId: "418063267919",
  appId: "1:418063267919:web:a956f6ce4c9705cc19d23a",
  measurementId: "G-KMNXXYW5ZS",
}

// Clase singleton para Firebase
class FirebaseClient {
  private static instance: FirebaseClient
  public app: ReturnType<typeof initializeApp> | null = null
  private _firestore: ReturnType<typeof getFirestore> | null = null
  private _auth: ReturnType<typeof getAuth> | null = null
  private _storage: ReturnType<typeof getStorage> | null = null
  private _database: ReturnType<typeof getDatabase> | null = null
  private _analytics: ReturnType<typeof getAnalytics> | null = null
  private _initialized = false

  private constructor() {
    // Constructor privado para singleton
    this.initializeApp()
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient()
    }
    return FirebaseClient.instance
  }

  private async initializeApp() {
    try {
      // Solo inicializar en el cliente
      if (typeof window !== "undefined") {
        console.log("Initializing Firebase app...")
        this.app = initializeApp(firebaseConfig)

        console.log("Initializing Firestore...")
        this._firestore = getFirestore(this.app)

        console.log("Initializing Auth...")
        this._auth = getAuth(this.app)

        console.log("Initializing Storage...")
        this._storage = getStorage(this.app)

        console.log("Initializing Realtime Database...")
        this._database = getDatabase(this.app)

        // Inicializar Analytics solo si es compatible con el navegador
        if (await isSupported()) {
          console.log("Initializing Analytics...")
          this._analytics = getAnalytics(this.app)
        }

        this._initialized = true
        console.log("Firebase initialized successfully")
      }
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      this._initialized = false
    }
  }

  public get firestore() {
    if (!this._firestore) {
      console.error("Firestore is not initialized")
    }
    return this._firestore
  }

  public get auth() {
    if (!this._auth) {
      console.error("Auth is not initialized")
    }
    return this._auth
  }

  public get storage() {
    if (!this._storage) {
      console.error("Storage is not initialized")
    }
    return this._storage
  }

  public get database() {
    if (!this._database) {
      console.error("Realtime Database is not initialized")
    }
    return this._database
  }

  public get analytics() {
    if (!this._analytics) {
      console.error("Analytics is not initialized or not supported")
    }
    return this._analytics
  }

  public get initialized() {
    return this._initialized
  }
}

// Crear la instancia singleton solo en el cliente
let firebaseClient: FirebaseClient | null = null

if (typeof window !== "undefined") {
  try {
    firebaseClient = FirebaseClient.getInstance()
  } catch (error) {
    console.error("Error creating Firebase client:", error)
  }
}

// Exportar las instancias de los servicios
export const app = firebaseClient?.app || null
export const firestore = firebaseClient?.firestore || null
export const auth = firebaseClient?.auth || null
export const storage = firebaseClient?.storage || null
export const database = firebaseClient?.database || null
export const analytics = firebaseClient?.analytics || null
export const db = firebaseClient?.firestore || null // Alias para mantener compatibilidad

// Exportar la instancia del cliente para verificación
export const firebase = firebaseClient
