"use server"

import { revalidatePath } from "next/cache"
import type { Machine, MachinePart } from "@/types"
import { createWearPartAlert } from "@/app/actions/notifications"

// Simulación de base de datos
let machines: Machine[] = [
  {
    id: 1,
    name: "Biseladora Automática",
    model: "BA-2000",
    serialNumber: "BA2000-12345",
    status: "Operativa",
    lastMaintenance: "2023-03-15",
    nextMaintenance: "2023-06-15",
    description: "Biseladora automática para lentes oftálmicos",
    location: "Área de Producción",
    purchaseDate: "2022-01-15",
    manufacturer: "OptiTech",
    item_inventario_asociado: 7, // Asociado con el Disco de Corte
  },
  {
    id: 2,
    name: "Bloqueadora Digital",
    model: "BD-500",
    serialNumber: "BD500-67890",
    status: "Mantenimiento",
    lastMaintenance: "2023-02-10",
    nextMaintenance: "2023-05-10",
    description: "Bloqueadora digital para preparación de lentes",
    location: "Área de Preparación",
    purchaseDate: "2022-02-20",
    manufacturer: "LensEquip",
  },
  {
    id: 3,
    name: "Trazadora Computarizada",
    model: "TC-1000",
    serialNumber: "TC1000-24680",
    status: "Inoperativa",
    lastMaintenance: "2023-01-20",
    nextMaintenance: "2023-04-20",
    description: "Trazadora computarizada para marcos",
    location: "Área de Diseño",
    purchaseDate: "2021-11-05",
    manufacturer: "FrameScan",
  },
  {
    id: 4,
    name: "Horno de Templado",
    model: "HT-300",
    serialNumber: "HT300-13579",
    status: "Operativa",
    lastMaintenance: "2023-03-05",
    nextMaintenance: "2023-06-05",
    description: "Horno para templado de lentes",
    location: "Área de Tratamientos",
    purchaseDate: "2022-03-10",
    manufacturer: "ThermoLens",
  },
  {
    id: 5,
    name: "Pulidora Automática",
    model: "PA-150",
    serialNumber: "PA150-97531",
    status: "Operativa",
    lastMaintenance: "2023-03-25",
    nextMaintenance: "2023-06-25",
    description: "Pulidora automática para acabado de lentes",
    location: "Área de Acabado",
    purchaseDate: "2022-04-15",
    manufacturer: "PolishTech",
  },
]

let machineParts: MachinePart[] = []

// Función de utilidad para manejar errores
const handleActionError = (error: unknown, message: string) => {
  console.error(`${message}:`, error)
  return {
    success: false,
    message: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
  }
}

export async function getMachines() {
  try {
    return machines
  } catch (error) {
    console.error("Error al obtener máquinas:", error)
    return []
  }
}

export async function getMachineById(id: number) {
  try {
    return machines.find((machine) => machine.id === id)
  } catch (error) {
    console.error(`Error al obtener máquina con ID ${id}:`, error)
    return null
  }
}

export async function createMachine(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const model = formData.get("model") as string
    const serialNumber = formData.get("serialNumber") as string
    const status = formData.get("status") as "Operativa" | "Mantenimiento" | "Inoperativa"
    const lastMaintenance = formData.get("lastMaintenance") as string
    const nextMaintenance = formData.get("nextMaintenance") as string

    // Validaciones básicas
    if (!name || !model || !serialNumber || !status || !lastMaintenance || !nextMaintenance) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados" }
    }

    const newMachine: Machine = {
      id: machines.length > 0 ? Math.max(...machines.map((m) => m.id)) + 1 : 1,
      name,
      model,
      serialNumber,
      status,
      lastMaintenance,
      nextMaintenance,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      manufacturer: formData.get("manufacturer") as string,
    }

    // Agregar el ítem de inventario asociado si se proporciona
    const itemInventarioAsociado = formData.get("item_inventario_asociado")
    if (itemInventarioAsociado && itemInventarioAsociado !== "none") {
      newMachine.item_inventario_asociado = Number(itemInventarioAsociado)
    }

    machines.push(newMachine)
    revalidatePath("/dashboard/machines")
    return { success: true, message: "Equipo creado exitosamente", machine: newMachine }
  } catch (error) {
    return handleActionError(error, "Error al crear máquina")
  }
}

export async function updateMachine(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const index = machines.findIndex((machine) => machine.id === id)

    if (index === -1) {
      return { success: false, message: "Equipo no encontrado" }
    }

    const name = formData.get("name") as string
    const model = formData.get("model") as string
    const serialNumber = formData.get("serialNumber") as string
    const status = formData.get("status") as "Operativa" | "Mantenimiento" | "Inoperativa"
    const lastMaintenance = formData.get("lastMaintenance") as string
    const nextMaintenance = formData.get("nextMaintenance") as string

    // Validaciones básicas
    if (!name || !model || !serialNumber || !status || !lastMaintenance || !nextMaintenance) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados" }
    }

    const updatedMachine: Machine = {
      id,
      name,
      model,
      serialNumber,
      status,
      lastMaintenance,
      nextMaintenance,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      manufacturer: formData.get("manufacturer") as string,
    }

    // Agregar el ítem de inventario asociado si se proporciona
    const itemInventarioAsociado = formData.get("item_inventario_asociado")
    if (itemInventarioAsociado && itemInventarioAsociado !== "none") {
      updatedMachine.item_inventario_asociado = Number(itemInventarioAsociado)
    }

    machines[index] = updatedMachine
    revalidatePath("/dashboard/machines")
    revalidatePath(`/dashboard/machines/${id}`)
    return { success: true, message: "Equipo actualizado exitosamente", machine: updatedMachine }
  } catch (error) {
    return handleActionError(error, "Error al actualizar máquina")
  }
}

export async function deleteMachine(id: number) {
  try {
    const initialLength = machines.length
    machines = machines.filter((machine) => machine.id !== id)

    if (machines.length === initialLength) {
      return { success: false, message: "Equipo no encontrado" }
    }

    // Eliminar también todas las piezas asociadas a esta máquina
    machineParts = machineParts.filter((part) => part.machineId !== id)

    revalidatePath("/dashboard/machines")
    return { success: true, message: "Equipo eliminado exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al eliminar máquina")
  }
}

export async function getMachineParts(machineId: number) {
  try {
    return machineParts.filter((part) => part.machineId === machineId)
  } catch (error) {
    console.error(`Error al obtener piezas para la máquina ${machineId}:`, error)
    return []
  }
}

export async function addMachinePart(formData: FormData) {
  try {
    const machineId = Number(formData.get("machineId"))
    const inventoryItemId = Number(formData.get("inventoryItemId"))
    const name = formData.get("name") as string
    const installationDate = formData.get("installationDate") as string
    const usageType = formData.get("usageType") as string
    const maxUsage = Number(formData.get("maxUsage"))

    // Validaciones básicas
    if (!machineId || !inventoryItemId || !name || !installationDate || !usageType || !maxUsage) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados" }
    }

    const newPart: MachinePart = {
      id: machineParts.length > 0 ? Math.max(...machineParts.map((p) => p.id)) + 1 : 1,
      machineId,
      inventoryItemId,
      name,
      installationDate,
      usageType,
      maxUsage,
      currentUsage: 0,
      status: "Normal",
    }

    machineParts.push(newPart)
    revalidatePath(`/dashboard/machines/${machineId}`)
    return { success: true, message: "Pieza añadida exitosamente", part: newPart }
  } catch (error) {
    return handleActionError(error, "Error al añadir pieza")
  }
}

export async function updateMachinePart(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const machineId = Number(formData.get("machineId"))
    const index = machineParts.findIndex((part) => part.id === id)

    if (index === -1) {
      return { success: false, message: "Pieza no encontrada" }
    }

    const inventoryItemId = Number(formData.get("inventoryItemId"))
    const name = formData.get("name") as string
    const installationDate = formData.get("installationDate") as string
    const usageType = formData.get("usageType") as string
    const maxUsage = Number(formData.get("maxUsage"))

    // Validaciones básicas
    if (!machineId || !inventoryItemId || !name || !installationDate || !usageType || !maxUsage) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados" }
    }

    const updatedPart: MachinePart = {
      ...machineParts[index],
      inventoryItemId,
      name,
      installationDate,
      usageType,
      maxUsage,
    }

    machineParts[index] = updatedPart
    revalidatePath(`/dashboard/machines/${machineId}`)
    return { success: true, message: "Pieza actualizada exitosamente", part: updatedPart }
  } catch (error) {
    return handleActionError(error, "Error al actualizar pieza")
  }
}

export async function deleteMachinePart(id: number) {
  try {
    const initialLength = machineParts.length
    const part = machineParts.find((part) => part.id === id)

    if (!part) {
      return { success: false, message: "Pieza no encontrada" }
    }

    machineParts = machineParts.filter((part) => part.id !== id)

    if (machineParts.length === initialLength) {
      return { success: false, message: "Pieza no encontrada" }
    }

    revalidatePath(`/dashboard/machines/${part.machineId}`)
    return { success: true, message: "Pieza eliminada exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al eliminar pieza")
  }
}

export async function updatePartUsage(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const additionalUsage = Number(formData.get("additionalUsage"))

    if (isNaN(additionalUsage) || additionalUsage <= 0) {
      return { success: false, message: "La cantidad de uso debe ser un número positivo" }
    }

    const index = machineParts.findIndex((part) => part.id === id)

    if (index === -1) {
      return { success: false, message: "Pieza no encontrada" }
    }

    const part = { ...machineParts[index] }
    part.currentUsage += additionalUsage

    // Actualizar el estado de la pieza
    let statusChanged = false
    let newStatus = part.status

    const usagePercentage = (part.currentUsage / part.maxUsage) * 100

    if (usagePercentage >= 100 && part.status !== "Crítico") {
      newStatus = "Crítico"
      statusChanged = true
    } else if (usagePercentage >= 75 && part.status !== "Advertencia") {
      newStatus = "Advertencia"
      statusChanged = true
    } else if (usagePercentage < 75 && part.status !== "Normal") {
      newStatus = "Normal"
      statusChanged = true
    }

    part.status = newStatus as "Normal" | "Advertencia" | "Crítico"
    machineParts[index] = part

    // Crear notificación si el estado cambió a Crítico o Advertencia
    if (statusChanged && (newStatus === "Crítico" || newStatus === "Advertencia")) {
      const machine = machines.find((m) => m.id === part.machineId)
      if (machine) {
        await createWearPartAlert(part.id.toString(), machine.name, part.name, usagePercentage)
      }
    }

    revalidatePath(`/dashboard/machines/${part.machineId}`)
    return {
      success: true,
      message: "Uso actualizado exitosamente",
      newStatus,
      statusChanged,
      usagePercentage: usagePercentage.toFixed(1),
    }
  } catch (error) {
    return handleActionError(error, "Error al actualizar uso")
  }
}

export async function replaceMachinePart(formData: FormData) {
  try {
    const partId = Number(formData.get("partId"))
    const newInventoryItemId = Number(formData.get("newInventoryItemId"))

    if (!newInventoryItemId) {
      return { success: false, message: "Debe seleccionar una pieza de repuesto" }
    }

    const index = machineParts.findIndex((part) => part.id === partId)

    if (index === -1) {
      return { success: false, message: "Pieza no encontrada" }
    }

    const part = machineParts[index]
    const machineId = part.machineId

    // Crear una nueva pieza con la información del repuesto
    const newPart: MachinePart = {
      id: machineParts.length > 0 ? Math.max(...machineParts.map((p) => p.id)) + 1 : 1,
      machineId: part.machineId,
      inventoryItemId: newInventoryItemId,
      name: part.name,
      installationDate: new Date().toISOString().split("T")[0],
      usageType: part.usageType,
      maxUsage: part.maxUsage,
      currentUsage: 0,
      status: "Normal",
    }

    machineParts.push(newPart)

    // Eliminar la pieza anterior
    machineParts = machineParts.filter((part) => part.id !== partId)

    revalidatePath(`/dashboard/machines/${machineId}`)
    return { success: true, message: "Pieza reemplazada exitosamente" }
  } catch (error) {
    return handleActionError(error, "Error al reemplazar pieza")
  }
}
