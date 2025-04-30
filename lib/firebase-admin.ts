import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Función para inicializar Firebase Admin
function initializeFirebaseAdmin() {
  // Verificar si ya está inicializado
  if (getApps().length > 0) {
    return getApps()[0]
  }

  try {
    // Verificar que las variables de entorno necesarias estén disponibles
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        "Firebase Admin SDK: faltan variables de entorno. " +
          `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, privateKey: ${!!privateKey}`,
      )
      return null
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
  } catch (error) {
    console.error("Error al inicializar Firebase Admin:", error)
    return null
  }
}

// Intentar inicializar Firebase Admin
const app = initializeFirebaseAdmin()

// Crear objetos mock o reales según si la inicialización fue exitosa
const auth = app
  ? getAuth(app)
  : {
      verifySessionCookie: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      getUser: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      createUser: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      updateUser: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      deleteUser: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      listUsers: () => Promise.reject(new Error("Firebase Admin no inicializado")),
      setCustomUserClaims: () => Promise.reject(new Error("Firebase Admin no inicializado")),
    }

const db = app ? getFirestore(app) : {}

// Exportar los servicios
export { auth, db }
