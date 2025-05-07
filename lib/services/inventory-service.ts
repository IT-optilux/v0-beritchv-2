"use client"

import { FirestoreService } from "./firestore-service"
import { where, orderBy, limit, query, getDocs, collection } from "firebase/firestore"
import { firestore } from "@/lib/firebase-client"

export interface InventoryItem {
  id?: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  location?: string
  status: string
  description?: string
  unit_price?: number
  supplier?: string
  tipo_de_item: string
  unidad_de_uso?: string
  vida_util_maxima?: number
  lifespan_unit?: string
  lifespan?: number
  created_at?: Date
  updated_at?: Date
  last_updated?: Date
}

export class InventoryService extends FirestoreService<InventoryItem> {
  constructor() {
    super("inventory")
  }

  async getLowStock(limit = 10): Promise<InventoryItem[]> {
    try {
      if (!firestore) throw new Error("Firestore no está inicializado")

      const q = query(
        collection(firestore, this.collectionName),
        where("quantity", "<=", "min_quantity"),
        orderBy("quantity", "asc"),
        limit(limit),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => this.mapToModel(doc))
    } catch (error) {
      console.error("Error al obtener inventario con bajo stock:", error)
      throw error
    }
  }

  async searchByName(searchTerm: string, maxResults = 20): Promise<InventoryItem[]> {
    try {
      if (!firestore) throw new Error("Firestore no está inicializado")

      // Firestore no soporta búsquedas de texto completo, así que hacemos una búsqueda básica
      const q = query(
        collection(firestore, this.collectionName),
        orderBy("name"),
        limit(100), // Obtenemos más resultados para filtrar después
      )

      const querySnapshot = await getDocs(q)

      // Filtrar los resultados que contienen el término de búsqueda
      const filteredResults = querySnapshot.docs
        .map((doc) => this.mapToModel(doc))
        .filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        .slice(0, maxResults)

      return filteredResults
    } catch (error) {
      console.error("Error al buscar inventario por nombre:", error)
      throw error
    }
  }

  async getByCategory(category: string): Promise<InventoryItem[]> {
    try {
      if (!firestore) throw new Error("Firestore no está inicializado")

      const q = query(collection(firestore, this.collectionName), where("category", "==", category), orderBy("name"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => this.mapToModel(doc))
    } catch (error) {
      console.error("Error al obtener inventario por categoría:", error)
      throw error
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<InventoryItem> {
    try {
      const item = await this.getById(id)
      if (!item) {
        throw new Error(`Elemento de inventario con ID ${id} no encontrado`)
      }

      const newQuantity = item.quantity + quantity
      if (newQuantity < 0) {
        throw new Error("La cantidad no puede ser negativa")
      }

      // Actualizar el estado basado en la cantidad
      let status = "En stock"
      if (newQuantity === 0) {
        status = "Agotado"
      } else if (newQuantity <= item.min_quantity) {
        status = "Bajo stock"
      }

      return this.update(id, {
        quantity: newQuantity,
        status,
        last_updated: new Date(),
      })
    } catch (error) {
      console.error("Error al actualizar cantidad de inventario:", error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()

// Funciones de compatibilidad para mantener la API existente
export const getInventoryItems = async () => {
  return await inventoryService.getAll()
}

export const getInventoryItem = async (id: string) => {
  return await inventoryService.getById(id)
}

export const createInventoryItem = async (data: Partial<InventoryItem>) => {
  return await inventoryService.create(data)
}

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
  return await inventoryService.update(id, data)
}

export const deleteInventoryItem = async (id: string) => {
  return await inventoryService.delete(id)
}
