import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Función para inicializar Firebase Admin
function initializeFirebaseAdmin() {
  // Verificar si ya está inicializado
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Verificar que las variables de entorno necesarias estén disponibles
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK no puede inicializarse: faltan variables de entorno. " +
        `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!privateKey}`,
    )
  }

  // Inicializar la aplicación con las credenciales
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Asegurarse de que la clave privada tenga el formato correcto
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  })
}

// Intentar inicializar Firebase Admin
let auth, firestore

try {
  const app = initializeFirebaseAdmin()
  auth = getAuth(app)
  firestore = getFirestore(app)
} catch (error) {
  console.error("Error al inicializar Firebase Admin:", error)
  // Crear objetos mock para evitar errores en tiempo de compilación
  auth = {
    verifySessionCookie: () => Promise.reject(new Error("Firebase Admin no inicializado")),
    getUser: () => Promise.reject(new Error("Firebase Admin no inicializado")),
  }
  firestore = {}
}

// Exportar los servicios
export { auth, firestore as db }
