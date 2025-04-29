// Reemplazando la implementación anterior con una compatible con Next.js
import * as admin from "firebase-admin"

// Verificar si Firebase Admin ya está inicializado
const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Reemplazar newlines en la private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  }

  return {
    auth: admin.auth(),
    firestore: admin.firestore(),
    storage: admin.storage(),
  }
}

// Exportar las instancias de Firebase Admin
const { auth, firestore, storage } = getFirebaseAdmin()

export { auth, firestore as db, storage }
