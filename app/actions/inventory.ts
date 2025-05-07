"use server"

import { inventoryService } from "@/lib/services/inventory-service"
import type { InventoryItem } from "@/types"
import { handleError } from "@/lib/error-handler"

// Obtener todos los elementos de inventario
export async function getAllInventoryItems() {
  try {
    return await inventoryService.getAll()
  } catch (error) {
    return handleError(error, "Error al obtener elementos de inventario")
  }
}

// Obtener un elemento de inventario por ID
export async function getInventoryItemById(id: string) {
  try {
    return await inventoryService.getById(id)
  } catch (error) {
    return handleError(error, `Error al obtener elemento de inventario con ID ${id}`)
  }
}

// Crear un nuevo elemento de inventario
export async function createInventoryItem(data: Partial<InventoryItem>) {
  try {
    // Calcular el estado basado en la cantidad y cantidad mínima
    const status = calculateStatus(data.quantity || 0, data.minQuantity || 0)

    // Crear el elemento con el estado calculado
    const id = await inventoryService.create({
      ...data,
      status,
      lastUpdated: new Date().toISOString(),
    })

    return { success: true, id }
  } catch (error) {
    return handleError(error, "Error al crear elemento de inventario")
  }
}

// Actualizar un elemento de inventario
export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  try {
    // Obtener el elemento actual para mantener los campos que no se actualizan
    const currentItem = await inventoryService.getById(id)
    if (!currentItem) {
      return { success: false, error: "Elemento no encontrado" }
    }

    // Calcular el estado basado en la cantidad y cantidad mínima
    const quantity = data.quantity !== undefined ? data.quantity : currentItem.quantity
    const minQuantity = data.minQuantity !== undefined ? data.minQuantity : currentItem.minQuantity
    const status = calculateStatus(quantity, minQuantity)

    // Actualizar el elemento con el estado calculado
    await inventoryService.update(id, {
      ...data,
      status,
      lastUpdated: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    return handleError(error, `Error al actualizar elemento de inventario con ID ${id}`)
  }
}

// Eliminar un elemento de inventario
export async function deleteInventoryItem(id: string) {
  try {
    await inventoryService.delete(id)
    return { success: true }
  } catch (error) {
    return handleError(error, `Error al eliminar elemento de inventario con ID ${id}`)
  }
}

// Función auxiliar para calcular el estado basado en la cantidad y cantidad mínima
function calculateStatus(quantity: number, minQuantity: number): "En stock" | "Bajo stock" | "Sin stock" {
  if (quantity <= 0) {
    return "Sin stock"
  } else if (quantity <= minQuantity) {
    return "Bajo stock"
  } else {
    return "En stock"
  }
}

// Buscar elementos de inventario
export async function searchInventoryItems(searchTerm: string) {
  try {
    return await inventoryService.search(searchTerm)
  } catch (error) {
    return handleError(error, `Error al buscar elementos de inventario con término "${searchTerm}"`)
  }
}

// Obtener elementos de inventario con paginación
export async function getPaginatedInventoryItems(pageSize: number, startAfterDoc?: any) {
  try {
    return await inventoryService.getPaginated(pageSize, startAfterDoc)
  } catch (error) {
    return handleError(error, "Error al obtener elementos de inventario paginados")
  }
}

// Obtener elementos de inventario con bajo stock
export async function getLowStockInventoryItems() {
  try {
    return await inventoryService.getLowStock()
  } catch (error) {
    return handleError(error, "Error al obtener elementos de inventario con bajo stock")
  }
}

// Funciones adicionales requeridas para la compatibilidad
export async function getInventoryItems() {
  try {
    return await inventoryService.getAll()
  } catch (error) {
    return handleError(error, "Error al obtener elementos de inventario")
  }
}

export async function adjustInventoryQuantity(id: string, quantity: number) {
  try {
    await inventoryService.updateQuantity(id, quantity)
    return { success: true }
  } catch (error) {
    return handleError(error, `Error al ajustar la cantidad del elemento de inventario con ID ${id}`)
  }
}

export async function getWearParts() {
  try {
    return await inventoryService.getByCategory("Partes de desgaste")
  } catch (error) {
    return handleError(error, "Error al obtener partes de desgaste")
  }
}
