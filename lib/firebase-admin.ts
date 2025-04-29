import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Configuración para Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Reemplazar los caracteres de escape en la clave privada
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
}

// Inicializar Firebase Admin solo una vez
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

// Exportar servicios de Firebase Admin
export const auth = getAuth(app)
export const firestore = getFirestore(app)

// Exportar la app para uso en otros módulos
export default app
