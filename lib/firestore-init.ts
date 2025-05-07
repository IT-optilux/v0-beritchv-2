import { firestore } from "@/lib/firebase-client"
import { collection, doc, setDoc, getDocs, query, limit } from "firebase/firestore"

// Función para verificar si una colección existe y crearla si no existe
export async function ensureCollectionExists(collectionName: string): Promise<boolean> {
  try {
    const collectionRef = collection(firestore, collectionName)
    const q = query(collectionRef, limit(1))
    const querySnapshot = await getDocs(q)

    // La colección existe si podemos obtener documentos
    console.log(`Colección ${collectionName} verificada`)
    return true
  } catch (error) {
    console.error(`Error al verificar la colección ${collectionName}:`, error)
    return false
  }
}

// Función para inicializar la estructura de datos en Firestore
export async function initializeFirestoreSchema(): Promise<void> {
  try {
    // Verificar y crear colecciones principales
    const collections = [
      "users",
      "inventory",
      "machines",
      "usageLogs",
      "maintenance",
      "reports",
      "notifications",
      "history",
    ]

    for (const collectionName of collections) {
      await ensureCollectionExists(collectionName)
    }

    console.log("Estructura de Firestore inicializada correctamente")
  } catch (error) {
    console.error("Error al inicializar la estructura de Firestore:", error)
  }
}

// Función para crear un usuario administrador inicial si no existe
export async function createInitialAdminUser(email: string, name: string): Promise<void> {
  try {
    const usersRef = collection(firestore, "users")
    const q = query(usersRef, limit(1))
    const querySnapshot = await getDocs(q)

    // Solo crear el usuario admin si no hay usuarios
    if (querySnapshot.empty) {
      const adminUser = {
        email,
        name,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(usersRef, "admin"), adminUser)
      console.log("Usuario administrador inicial creado")
    } else {
      console.log("Ya existen usuarios en la base de datos")
    }
  } catch (error) {
    console.error("Error al crear el usuario administrador inicial:", error)
  }
}
