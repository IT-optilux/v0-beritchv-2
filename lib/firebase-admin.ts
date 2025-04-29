import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"

// Verificar si ya hay una instancia de Firebase Admin inicializada
const apps = getApps()

// Configuración para Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}

// Inicializar Firebase Admin solo si no hay instancias previas
const app = apps.length === 0 ? initializeApp(firebaseAdminConfig) : apps[0]

// Exportar servicios de Firebase Admin
export const adminDb = getFirestore(app)
export const auth = getAuth(app)
export const adminStorage = getStorage(app)
