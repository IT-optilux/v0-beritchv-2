"use server"

import { revalidatePath } from "next/cache"
import type { Maintenance, MaintenancePart } from "@/types"
import { adjustInventoryQuantity, getInventoryItemById } from "@/app/actions/inventory"

// Simulación de base de datos para mantenimientos
let maintenances: Maintenance[] = [
  {
    id: 1,
    machineId: 1,
    machineName: "Biseladora Automática",
    maintenanceType: "Preventivo",
    description: "Mantenimiento preventivo programado",
    startDate: "2023-04-15",
    endDate: "2023-04-15",
    status: "Completado",
    technician: "Carlos Técnico",
    cost: 250.0,
    observations: "Se realizó limpieza general y ajuste de parámetros",
  },
  {
    id: 2,
    machineId: 2,
    machineName: "Bloqueadora Digital",
    maintenanceType: "Correctivo",
    description: "Reparación de sistema de bloqueo",
    startDate: "2023-04-10",
    status: "En proceso",
    technician: "Luis Mantenimiento",
  },
  {
    id: 3,
    machineId: 3,
    machineName: "Trazadora Computarizada",
    maintenanceType: "Calibración",
    description: "Calibración de sensores",
    startDate: "2023-04-20",
    status: "Programado",
    technician: "Ana Técnico",
  },
]

// Simulación de base de datos para repuestos utilizados
let maintenanceParts: MaintenancePart[] = [
  {
    id: 1,
    mantenimiento_id: 1,
    item_inventario_id: 7,
    item_inventario_nombre: "Disco de Corte",
    cantidad_utilizada: 1,
    costo_unitario: 85.0,
    total_costo: 85.0,
    fecha_registro: "2023-04-15",
  },
]

/**
 * Obtiene todos los mantenimientos
 */
export async function getMaintenances() {
  return maintenances
}

/**
 * Obtiene un mantenimiento por su ID
 */
export async function getMaintenanceById(id: number) {
  return maintenances.find((maintenance) => maintenance.id === id)
}

/**
 * Crea un nuevo mantenimiento
 */
export async function createMaintenance(formData: FormData) {
  const newMaintenance: Maintenance = {
    id: maintenances.length > 0 ? Math.max(...maintenances.map((m) => m.id)) + 1 : 1,
    machineId: Number(formData.get("machineId")),
    machineName: formData.get("machineName") as string,
    maintenanceType: formData.get("maintenanceType") as "Preventivo" | "Correctivo" | "Calibración",
    description: formData.get("description") as string,
    startDate: formData.get("startDate") as string,
    status: formData.get("status") as "Programado" | "En proceso" | "Completado" | "Cancelado",
    technician: formData.get("technician") as string,
  }

  // Campos opcionales
  const endDate = formData.get("endDate") as string
  if (endDate) newMaintenance.endDate = endDate

  const cost = formData.get("cost")
  if (cost) newMaintenance.cost = Number(cost)

  const observations = formData.get("observations") as string
  if (observations) newMaintenance.observations = observations

  maintenances.push(newMaintenance)
  revalidatePath("/dashboard/maintenance")
  return { success: true, message: "Mantenimiento creado exitosamente", maintenance: newMaintenance }
}

/**
 * Actualiza un mantenimiento existente
 */
export async function updateMaintenance(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = maintenances.findIndex((maintenance) => maintenance.id === id)

  if (index === -1) {
    return { success: false, message: "Mantenimiento no encontrado" }
  }

  const updatedMaintenance: Maintenance = {
    id,
    machineId: Number(formData.get("machineId")),
    machineName: formData.get("machineName") as string,
    maintenanceType: formData.get("maintenanceType") as "Preventivo" | "Correctivo" | "Calibración",
    description: formData.get("description") as string,
    startDate: formData.get("startDate") as string,
    status: formData.get("status") as "Programado" | "En proceso" | "Completado" | "Cancelado",
    technician: formData.get("technician") as string,
  }

  // Campos opcionales
  const endDate = formData.get("endDate") as string
  if (endDate) updatedMaintenance.endDate = endDate

  const cost = formData.get("cost")
  if (cost) updatedMaintenance.cost = Number(cost)

  const observations = formData.get("observations") as string
  if (observations) updatedMaintenance.observations = observations

  maintenances[index] = updatedMaintenance
  revalidatePath("/dashboard/maintenance")
  revalidatePath(`/dashboard/maintenance/${id}`)
  return { success: true, message: "Mantenimiento actualizado exitosamente", maintenance: updatedMaintenance }
}

/**
 * Elimina un mantenimiento
 */
export async function deleteMaintenance(id: number) {
  const initialLength = maintenances.length
  maintenances = maintenances.filter((maintenance) => maintenance.id !== id)

  if (maintenances.length === initialLength) {
    return { success: false, message: "Mantenimiento no encontrado" }
  }

  // También eliminar los repuestos asociados
  maintenanceParts = maintenanceParts.filter((part) => part.mantenimiento_id !== id)

  revalidatePath("/dashboard/maintenance")
  return { success: true, message: "Mantenimiento eliminado exitosamente" }
}

/**
 * Obtiene todos los repuestos utilizados en un mantenimiento
 */
export async function getMaintenancePartsByMaintenanceId(maintenanceId: number) {
  return maintenanceParts.filter((part) => part.mantenimiento_id === maintenanceId)
}

/**
 * Registra un nuevo repuesto utilizado en un mantenimiento
 */
export async function addMaintenancePart(formData: FormData) {
  const mantenimiento_id = Number(formData.get("mantenimiento_id"))
  const item_inventario_id = Number(formData.get("item_inventario_id"))
  const cantidad_utilizada = Number(formData.get("cantidad_utilizada"))
  const costo_unitario = Number(formData.get("costo_unitario"))
  const total_costo = cantidad_utilizada * costo_unitario

  // Verificar que el mantenimiento existe
  const maintenance = await getMaintenanceById(mantenimiento_id)
  if (!maintenance) {
    return { success: false, message: "El mantenimiento especificado no existe" }
  }

  // Verificar que el ítem de inventario existe y tiene suficiente stock
  const inventoryItem = await getInventoryItemById(item_inventario_id)
  if (!inventoryItem) {
    return { success: false, message: "El ítem de inventario especificado no existe" }
  }

  if (inventoryItem.quantity < cantidad_utilizada) {
    return {
      success: false,
      message: `Stock insuficiente. Disponible: ${inventoryItem.quantity}, Solicitado: ${cantidad_utilizada}`,
    }
  }

  // Crear el nuevo registro de repuesto utilizado
  const newPart: MaintenancePart = {
    id: maintenanceParts.length > 0 ? Math.max(...maintenanceParts.map((p) => p.id)) + 1 : 1,
    mantenimiento_id,
    item_inventario_id,
    item_inventario_nombre: inventoryItem.name,
    cantidad_utilizada,
    costo_unitario,
    total_costo,
    fecha_registro: new Date().toISOString().split("T")[0],
  }

  // Descontar la cantidad del inventario
  const adjustmentFormData = new FormData()
  adjustmentFormData.append("id", item_inventario_id.toString())
  adjustmentFormData.append("adjustmentType", "subtract")
  adjustmentFormData.append("adjustmentQuantity", cantidad_utilizada.toString())

  const adjustmentResult = await adjustInventoryQuantity(adjustmentFormData)

  if (!adjustmentResult.success) {
    return { success: false, message: `Error al ajustar el inventario: ${adjustmentResult.message}` }
  }

  // Guardar el registro de repuesto utilizado
  maintenanceParts.push(newPart)

  // Actualizar el costo total del mantenimiento
  const maintenanceIndex = maintenances.findIndex((m) => m.id === mantenimiento_id)
  if (maintenanceIndex !== -1) {
    const currentCost = maintenances[maintenanceIndex].cost || 0
    maintenances[maintenanceIndex].cost = currentCost + total_costo
  }

  revalidatePath(`/dashboard/maintenance/${mantenimiento_id}`)
  return {
    success: true,
    message: "Repuesto registrado exitosamente y descontado del inventario",
    part: newPart,
  }
}

/**
 * Elimina un repuesto utilizado
 */
export async function deleteMaintenancePart(id: number) {
  const part = maintenanceParts.find((p) => p.id === id)
  if (!part) {
    return { success: false, message: "Repuesto no encontrado" }
  }

  const maintenanceId = part.mantenimiento_id

  // Devolver la cantidad al inventario
  const adjustmentFormData = new FormData()
  adjustmentFormData.append("id", part.item_inventario_id.toString())
  adjustmentFormData.append("adjustmentType", "add")
  adjustmentFormData.append("adjustmentQuantity", part.cantidad_utilizada.toString())

  const adjustmentResult = await adjustInventoryQuantity(adjustmentFormData)

  if (!adjustmentResult.success) {
    return { success: false, message: `Error al ajustar el inventario: ${adjustmentResult.message}` }
  }

  // Actualizar el costo total del mantenimiento
  const maintenanceIndex = maintenances.findIndex((m) => m.id === maintenanceId)
  if (maintenanceIndex !== -1) {
    const currentCost = maintenances[maintenanceIndex].cost || 0
    maintenances[maintenanceIndex].cost = Math.max(0, currentCost - part.total_costo)
  }

  // Eliminar el registro
  maintenanceParts = maintenanceParts.filter((p) => p.id !== id)

  revalidatePath(`/dashboard/maintenance/${maintenanceId}`)
  return {
    success: true,
    message: "Repuesto eliminado exitosamente y devuelto al inventario",
  }
}
