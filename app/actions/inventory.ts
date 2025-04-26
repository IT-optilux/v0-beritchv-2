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
  },
]

export async function getInventoryItems() {
  return inventoryItems
}

export async function getInventoryItemById(id: number) {
  return inventoryItems.find((item) => item.id === id)
}

export async function createInventoryItem(formData: FormData) {
  const quantity = Number(formData.get("quantity"))
  const minQuantity = Number(formData.get("minQuantity"))

  let status: "En stock" | "Bajo stock" | "Sin stock" = "En stock"
  if (quantity === 0) {
    status = "Sin stock"
  } else if (quantity < minQuantity) {
    status = "Bajo stock"
  }

  const newItem: InventoryItem = {
    id: inventoryItems.length > 0 ? Math.max(...inventoryItems.map((item) => item.id)) + 1 : 1,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    quantity,
    minQuantity,
    location: formData.get("location") as string,
    lastUpdated: new Date().toISOString().split("T")[0],
    status,
    description: formData.get("description") as string,
    unitPrice: Number(formData.get("unitPrice")),
    supplier: formData.get("supplier") as string,
    tipo_de_item: formData.get("tipo_de_item") as "consumible" | "pieza de desgaste" | "repuesto general" | undefined,
  }

  // Agregar campos adicionales si es una pieza de desgaste
  if (newItem.tipo_de_item === "pieza de desgaste") {
    newItem.unidad_de_uso = formData.get("unidad_de_uso") as string
    newItem.vida_util_maxima = Number(formData.get("vida_util_maxima"))
  }

  inventoryItems.push(newItem)
  revalidatePath("/dashboard/inventory")
  return { success: true, message: "Ítem de inventario creado exitosamente", item: newItem }
}

export async function updateInventoryItem(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = inventoryItems.findIndex((item) => item.id === id)

  if (index === -1) {
    return { success: false, message: "Ítem de inventario no encontrado" }
  }

  const quantity = Number(formData.get("quantity"))
  const minQuantity = Number(formData.get("minQuantity"))

  let status: "En stock" | "Bajo stock" | "Sin stock" = "En stock"
  if (quantity === 0) {
    status = "Sin stock"
  } else if (quantity < minQuantity) {
    status = "Bajo stock"
  }

  const updatedItem: InventoryItem = {
    id,
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    quantity,
    minQuantity,
    location: formData.get("location") as string,
    lastUpdated: new Date().toISOString().split("T")[0],
    status,
    description: formData.get("description") as string,
    unitPrice: Number(formData.get("unitPrice")),
    supplier: formData.get("supplier") as string,
    tipo_de_item: formData.get("tipo_de_item") as "consumible" | "pieza de desgaste" | "repuesto general" | undefined,
  }

  // Agregar campos adicionales si es una pieza de desgaste
  if (updatedItem.tipo_de_item === "pieza de desgaste") {
    updatedItem.unidad_de_uso = formData.get("unidad_de_uso") as string
    updatedItem.vida_util_maxima = Number(formData.get("vida_util_maxima"))
  }

  inventoryItems[index] = updatedItem
  revalidatePath("/dashboard/inventory")
  return { success: true, message: "Ítem de inventario actualizado exitosamente", item: updatedItem }
}

export async function adjustInventoryQuantity(formData: FormData) {
  const id = Number(formData.get("id"))
  const adjustmentType = formData.get("adjustmentType") as "add" | "subtract"
  const adjustmentQuantity = Number(formData.get("adjustmentQuantity"))

  const index = inventoryItems.findIndex((item) => item.id === id)

  if (index === -1) {
    return { success: false, message: "Ítem de inventario no encontrado" }
  }

  const item = { ...inventoryItems[index] }

  if (adjustmentType === "add") {
    item.quantity += adjustmentQuantity
  } else {
    item.quantity = Math.max(0, item.quantity - adjustmentQuantity)
  }

  // Actualizar el estado basado en la nueva cantidad
  if (item.quantity === 0) {
    item.status = "Sin stock"
  } else if (item.quantity < item.minQuantity) {
    item.status = "Bajo stock"
  } else {
    item.status = "En stock"
  }

  item.lastUpdated = new Date().toISOString().split("T")[0]

  inventoryItems[index] = item
  revalidatePath("/dashboard/inventory")
  return { success: true, message: "Cantidad ajustada exitosamente", item }
}

export async function deleteInventoryItem(id: number) {
  const initialLength = inventoryItems.length
  inventoryItems = inventoryItems.filter((item) => item.id !== id)

  if (inventoryItems.length === initialLength) {
    return { success: false, message: "Ítem de inventario no encontrado" }
  }

  revalidatePath("/dashboard/inventory")
  return { success: true, message: "Ítem de inventario eliminado exitosamente" }
}

// Función para obtener solo las piezas de desgaste
export async function getWearParts() {
  return inventoryItems.filter((item) => item.tipo_de_item === "pieza de desgaste")
}
