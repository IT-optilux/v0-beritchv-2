"use server"

import { revalidatePath } from "next/cache"
import type { InventoryItem } from "@/types"

// Simulación de base de datos
let inventoryItems: InventoryItem[] = [
  {
    id: 1,
    name: "Moldes CR-39",
    category: "Moldes",
    quantity: 150,
    minQuantity: 50,
    location: "Almacén A",
    lastUpdated: "2023-04-01",
    status: "En stock",
    description: "Moldes para lentes CR-39 estándar",
    unitPrice: 15.5,
    supplier: "OptiSupplies Inc.",
    tipo_de_item: "consumible",
  },
  {
    id: 2,
    name: "Moldes Policarbonato",
    category: "Moldes",
    quantity: 80,
    minQuantity: 30,
    location: "Almacén A",
    lastUpdated: "2023-04-02",
    status: "En stock",
    description: "Moldes para lentes de policarbonato",
    unitPrice: 22.75,
    supplier: "PolyVision Ltd.",
    tipo_de_item: "consumible",
  },
  {
    id: 3,
    name: "Bloques de Aleación",
    category: "Bloques",
    quantity: 25,
    minQuantity: 20,
    location: "Almacén B",
    lastUpdated: "2023-04-03",
    status: "Bajo stock",
    description: "Bloques de aleación para fijación",
    unitPrice: 8.25,
    supplier: "MetalOptics Co.",
    tipo_de_item: "consumible",
  },
  {
    id: 4,
    name: "Cinta Adhesiva",
    category: "Consumibles",
    quantity: 45,
    minQuantity: 15,
    location: "Almacén C",
    lastUpdated: "2023-04-05",
    status: "En stock",
    description: "Cinta adhesiva especial para laboratorio",
    unitPrice: 5.99,
    supplier: "AdhesivePro",
    tipo_de_item: "consumible",
  },
  {
    id: 5,
    name: "Líquido Pulidor",
    category: "Químicos",
    quantity: 10,
    minQuantity: 15,
    location: "Almacén D",
    lastUpdated: "2023-04-06",
    status: "Bajo stock",
    description: "Líquido para pulido de lentes",
    unitPrice: 32.5,
    supplier: "ChemLens Solutions",
    tipo_de_item: "consumible",
  },
  {
    id: 6,
    name: "Repuestos Biseladora",
    category: "Repuestos",
    quantity: 0,
    minQuantity: 5,
    location: "Almacén B",
    lastUpdated: "2023-04-07",
    status: "Sin stock",
    description: "Kit de repuestos para biseladora",
    unitPrice: 120.0,
    supplier: "OptiTech",
    tipo_de_item: "repuesto general",
  },
  {
    id: 7,
    name: "Disco de Corte",
    category: "Repuestos",
    quantity: 5,
    minQuantity: 3,
    location: "Almacén B",
    lastUpdated: "2023-04-08",
    status: "En stock",
    description: "Disco de corte para biseladora",
    unitPrice: 85.0,
    supplier: "OptiTech",
    tipo_de_item: "pieza de desgaste",
    unidad_de_uso: "Cortes",
    vida_util_maxima: 25000,
    lifespanUnit: "Cortes",
    lifespan: 25000,
  },
]

// Función de utilidad para manejar errores
const handleActionError = (error: unknown, message: string) => {
  console.error(`${message}:`, error)
  return {
    success: false,
    message: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
  }
}

// Función para determinar el estado del ítem basado en la cantidad
const determineItemStatus = (quantity: number, minQuantity: number): "En stock" | "Bajo stock" | "Sin stock" => {
  if (quantity === 0) {
    return "Sin stock"
  } else if (quantity < minQuantity) {
    return "Bajo stock"
  } else {
    return "En stock"
  }
}

export async function getInventoryItems() {
  try {
    return inventoryItems
  } catch (error) {
    console.error("Error al obtener ítems de inventario:", error)
    return []
  }
}

export async function getInventoryItemById(id: number) {
  try {
    return inventoryItems.find((item) => item.id === id)
  } catch (error) {
    console.error(`Error al obtener ítem de inventario con ID ${id}:`, error)
    return null
  }
}

export async function createInventoryItem(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const quantity = Number(formData.get("quantity"))
    const minQuantity = Number(formData.get("minQuantity"))
    const location = formData.get("location") as string

    // Validaciones básicas
    if (!name || !category || isNaN(quantity) || isNaN(minQuantity) || !location) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados correctamente" }
    }

    if (quantity < 0 || minQuantity < 0) {
      return { success: false, message: "Las cantidades no pueden ser negativas" }
    }

    const status = determineItemStatus(quantity, minQuantity)

    const newItem: InventoryItem = {
      id: inventoryItems.length > 0 ? Math.max(...inventoryItems.map((item) => item.id)) + 1 : 1,
      name,
      category,
      quantity,
      minQuantity,
      location,
      lastUpdated: new Date().toISOString().split("T")[0],
      status,
      description: formData.get("description") as string,
      unitPrice: Number(formData.get("unitPrice")) || 0,
      supplier: formData.get("supplier") as string,
      tipo_de_item: formData.get("tipo_de_item") as "consumible" | "pieza de desgaste" | "repuesto general" | undefined,
    }

    // Agregar campos adicionales si es una pieza de desgaste
    if (newItem.tipo_de_item === "pieza de desgaste") {
      const unidadDeUso = formData.get("unidad_de_uso") as string
      const vidaUtilMaxima = Number(formData.get("vida_util_maxima"))

      if (!unidadDeUso || isNaN(vidaUtilMaxima) || vidaUtilMaxima <= 0) {
        return {
          success: false,
          message: "Para piezas de desgaste, debe especificar la unidad de uso y una vida útil máxima válida",
        }
      }

      newItem.unidad_de_uso = unidadDeUso
      newItem.vida_util_maxima = vidaUtilMaxima
      newItem.lifespanUnit = unidadDeUso // Para compatibilidad
      newItem.lifespan = vidaUtilMaxima // Para compatibilidad
    }

    inventoryItems.push(newItem)
    revalidatePath("/dashboard/inventory")
    return { success: true, message: "Ítem de inventario creado exitosamente", item: newItem }
  } catch (error) {
    return handleActionError(error, "Error al crear ítem de inventario")
  }
}

export async function updateInventoryItem(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const index = inventoryItems.findIndex((item) => item.id === id)

    if (index === -1) {
      return { success: false, message: "Ítem de inventario no encontrado" }
    }

    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const quantity = Number(formData.get("quantity"))
    const minQuantity = Number(formData.get("minQuantity"))
    const location = formData.get("location") as string

    // Validaciones básicas
    if (!name || !category || isNaN(quantity) || isNaN(minQuantity) || !location) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados correctamente" }
    }

    if (quantity < 0 || minQuantity < 0) {
      return { success: false, message: "Las cantidades no pueden ser negativas" }
    }

    const status = determineItemStatus(quantity, minQuantity)

    const updatedItem: InventoryItem = {
      id,
      name,
      category,
      quantity,
      minQuantity,
      location,
      lastUpdated: new Date().toISOString().split("T")[0],
      status,
      description: formData.get("description") as string,
      unitPrice: Number(formData.get("unitPrice")) || 0,
      supplier: formData.get("supplier") as string,
      tipo_de_item: formData.get("tipo_de_item") as "consumible" | "pieza de desgaste" | "repuesto general" | undefined,
    }

    // Agregar campos adicionales si es una pieza de desgaste
    if (updatedItem.tipo_de_item === "pieza de desgaste") {
      const unidadDeUso = formData.get("unidad_de_uso") as string
      const vidaUtilMaxima = Number(formData.get("vida_util_maxima"))

      if (!unidadDeUso || isNaN(vidaUtilMaxima) || vidaUtilMaxima <= 0) {
        return {
          success: false,
          message: "Para piezas de desgaste, debe especificar la unidad de uso y una vida útil máxima válida",
        }
      }

      updatedItem.unidad_de_uso = unidadDeUso
      updatedItem.vida_util_maxima = vidaUtilMaxima
      updatedItem.lifespanUnit = unidadDeUso // Para compatibilidad
      updatedItem.lifespan = vidaUtilMaxima // Para compatibilidad
    }

    inventoryItems[index] = updatedItem
    revalidatePath("/dashboard/inventory")
    return { success: true, message: "Ítem de inventario actualizado exitosamente", item: updatedItem }
  } catch (error) {
    return handleActionError(error, "Error al actualizar ítem de inventario")
  }
}

export async function adjustInventoryQuantity(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const adjustmentType = formData.get("adjustmentType") as "add" | "subtract"
    const adjustmentQuantity = Number(formData.get("adjustmentQuantity"))

    if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
      return { success: false, message: "La cantidad de ajuste debe ser un número positivo" }
    }

    const index = inventoryItems.findIndex((item) => item.id === id)

    if (index === -1) {
      return { success: false, message: "Ítem de inventario no encontrado" }
    }

    const item = { ...inventoryItems[index] }

    if (adjustmentType === "add") {
      item.quantity += adjustmentQuantity
    } else {
      if (item.quantity < adjustmentQuantity) {
        return {
          success: false,
          message: `No se puede restar ${adjustmentQuantity} unidades porque solo hay ${item.quantity} disponibles`,
        }
      }
      item.quantity = Math.max(0, item.quantity - adjustmentQuantity)
    }

    // Actualizar el estado basado en la nueva cantidad
    item.status = determineItemStatus(item.quantity, item.minQuantity)
    item.lastUpdated = new Date().toISOString().split("T")[0]

    inventoryItems[index] = item
    revalidatePath("/dashboard/inventory")
    return {
      success: true,
      message: `Cantidad ${adjustmentType === "add" ? "aumentada" : "reducida"} exitosamente`,
      item,
    }
  } catch (error) {
    return handleActionError(error, "Error al ajustar cantidad")
  }
}

export async function deleteInventoryItem(id: number) {
  try {
    const initialLength = inventoryItems.length
    inventoryItems = inventoryItems.filter((item) => item.id !== id)

    if (inventoryItems.length === initialLength) {
      return { success: false, message: "Ítem de inventario no encontrado" }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true, message: "Ítem de inventario eliminado exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al eliminar ítem de inventario")
  }
}

// Función para obtener solo las piezas de desgaste
export async function getWearParts() {
  try {
    return inventoryItems.filter((item) => item.tipo_de_item === "pieza de desgaste")
  } catch (error) {
    console.error("Error al obtener piezas de desgaste:", error)
    return []
  }
}
