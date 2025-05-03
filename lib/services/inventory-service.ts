import { db } from "@/lib/firebase-client"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import type { InventoryItem } from "@/types"
import { handleError } from "@/lib/error-handler"

// Obtener todos los elementos de inventario
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const inventoryRef = collection(db, "inventory")
    const q = query(inventoryRef, orderBy("name", "asc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as InventoryItem,
    )
  } catch (error) {
    handleError("Error al obtener elementos de inventario", error)
    return []
  }
}

// Obtener un elemento específico del inventario
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  try {
    const docRef = doc(db, `inventory/${id}`)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as InventoryItem
    }

    return null
  } catch (error) {
    handleError(`Error al obtener el elemento de inventario con ID ${id}`, error)
    return null
  }
}

// Crear un nuevo elemento de inventario
export async function createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  try {
    const inventoryRef = collection(db, "inventory")

    // Determinar el estado basado en la cantidad
    const status = data.quantity && data.minQuantity && data.quantity < data.minQuantity ? "Bajo stock" : "En stock"

    const newItem = {
      ...data,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(inventoryRef, newItem)

    return {
      id: docRef.id,
      ...newItem,
    } as InventoryItem
  } catch (error) {
    handleError("Error al crear elemento de inventario", error)
    throw error
  }
}

// Actualizar un elemento de inventario existente
export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  try {
    const docRef = doc(db, `inventory/${id}`)

    // Si se actualiza la cantidad, actualizar también el estado
    const updateData = { ...data, updatedAt: serverTimestamp() }

    if (data.quantity !== undefined) {
      // Obtener el elemento actual para verificar minQuantity
      const currentItem = await getInventoryItem(id)
      if (currentItem && currentItem.minQuantity) {
        updateData.status = data.quantity < currentItem.minQuantity ? "Bajo stock" : "En stock"
      }
    }

    await updateDoc(docRef, updateData)
  } catch (error) {
    handleError(`Error al actualizar el elemento de inventario con ID ${id}`, error)
    throw error
  }
}

// Eliminar un elemento de inventario
export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const docRef = doc(db, `inventory/${id}`)
    await deleteDoc(docRef)
  } catch (error) {
    handleError(`Error al eliminar el elemento de inventario con ID ${id}`, error)
    throw error
  }
}

// Buscar elementos de inventario por categoría
export async function getInventoryItemsByCategory(category: string): Promise<InventoryItem[]> {
  try {
    const inventoryRef = collection(db, "inventory")
    const q = query(inventoryRef, where("category", "==", category), orderBy("name", "asc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as InventoryItem,
    )
  } catch (error) {
    handleError(`Error al obtener elementos de inventario por categoría ${category}`, error)
    return []
  }
}

// Obtener elementos con bajo stock
export async function getLowStockItems(): Promise<InventoryItem[]> {
  try {
    const inventoryRef = collection(db, "inventory")
    const q = query(inventoryRef, where("status", "==", "Bajo stock"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as InventoryItem,
    )
  } catch (error) {
    handleError("Error al obtener elementos con bajo stock", error)
    return []
  }
}
