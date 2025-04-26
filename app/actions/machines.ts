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

export async function getMachines() {
  return machines
}

export async function getMachineById(id: number) {
  return machines.find((machine) => machine.id === id)
}

export async function createMachine(formData: FormData) {
  const newMachine: Machine = {
    id: machines.length > 0 ? Math.max(...machines.map((m) => m.id)) + 1 : 1,
    name: formData.get("name") as string,
    model: formData.get("model") as string,
    serialNumber: formData.get("serialNumber") as string,
    status: formData.get("status") as "Operativa" | "Mantenimiento" | "Inoperativa",
    lastMaintenance: formData.get("lastMaintenance") as string,
    nextMaintenance: formData.get("nextMaintenance") as string,
    description: formData.get("description") as string,
    location: formData.get("location") as string,
    purchaseDate: formData.get("purchaseDate") as string,
    manufacturer: formData.get("manufacturer") as string,
  }

  // Agregar el ítem de inventario asociado si se proporciona
  const itemInventarioAsociado = formData.get("item_inventario_asociado")
  if (itemInventarioAsociado && itemInventarioAsociado !== "") {
    newMachine.item_inventario_asociado = Number(itemInventarioAsociado)
  }

  machines.push(newMachine)
  revalidatePath("/dashboard/machines")
  return { success: true, message: "Equipo creado exitosamente", machine: newMachine }
}

export async function updateMachine(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = machines.findIndex((machine) => machine.id === id)

  if (index === -1) {
    return { success: false, message: "Equipo no encontrado" }
  }

  const updatedMachine: Machine = {
    id,
    name: formData.get("name") as string,
    model: formData.get("model") as string,
    serialNumber: formData.get("serialNumber") as string,
    status: formData.get("status") as "Operativa" | "Mantenimiento" | "Inoperativa",
    lastMaintenance: formData.get("lastMaintenance") as string,
    nextMaintenance: formData.get("nextMaintenance") as string,
    description: formData.get("description") as string,
    location: formData.get("location") as string,
    purchaseDate: formData.get("purchaseDate") as string,
    manufacturer: formData.get("manufacturer") as string,
  }

  // Agregar el ítem de inventario asociado si se proporciona
  const itemInventarioAsociado = formData.get("item_inventario_asociado")
  if (itemInventarioAsociado && itemInventarioAsociado !== "") {
    updatedMachine.item_inventario_asociado = Number(itemInventarioAsociado)
  }

  machines[index] = updatedMachine
  revalidatePath("/dashboard/machines")
  revalidatePath(`/dashboard/machines/${id}`)
  return { success: true, message: "Equipo actualizado exitosamente", machine: updatedMachine }
}

export async function deleteMachine(id: number) {
  const initialLength = machines.length
  machines = machines.filter((machine) => machine.id !== id)

  if (machines.length === initialLength) {
    return { success: false, message: "Equipo no encontrado" }
  }

  revalidatePath("/dashboard/machines")
  return { success: true, message: "Equipo eliminado exitosamente" }
}

export async function getMachineParts(machineId: number) {
  return machineParts.filter((part) => part.machineId === machineId)
}

export async function addMachinePart(formData: FormData) {
  const machineId = Number(formData.get("machineId"))
  const inventoryItemId = Number(formData.get("inventoryItemId"))
  const maxUsage = Number(formData.get("maxUsage"))

  const newPart: MachinePart = {
    id: machineParts.length > 0 ? Math.max(...machineParts.map((p) => p.id)) + 1 : 1,
    machineId,
    inventoryItemId,
    name: formData.get("name") as string,
    installationDate: formData.get("installationDate") as string,
    usageType: formData.get("usageType") as string,
    maxUsage,
    currentUsage: 0,
    status: "Normal",
  }

  machineParts.push(newPart)
  revalidatePath(`/dashboard/machines/${machineId}`)
  return { success: true, message: "Pieza añadida exitosamente", part: newPart }
}

export async function updateMachinePart(formData: FormData) {
  const id = Number(formData.get("id"))
  const machineId = Number(formData.get("machineId"))
  const index = machineParts.findIndex((part) => part.id === id)

  if (index === -1) {
    return { success: false, message: "Pieza no encontrada" }
  }

  const updatedPart: MachinePart = {
    ...machineParts[index],
    inventoryItemId: Number(formData.get("inventoryItemId")),
    name: formData.get("name") as string,
    installationDate: formData.get("installationDate") as string,
    usageType: formData.get("usageType") as string,
    maxUsage: Number(formData.get("maxUsage")),
  }

  machineParts[index] = updatedPart
  revalidatePath(`/dashboard/machines/${machineId}`)
  return { success: true, message: "Pieza actualizada exitosamente", part: updatedPart }
}

export async function deleteMachinePart(id: number) {
  const initialLength = machineParts.length
  const part = machineParts.find((part) => part.id === id)
  machineParts = machineParts.filter((part) => part.id !== id)

  if (machineParts.length === initialLength) {
    return { success: false, message: "Pieza no encontrada" }
  }

  revalidatePath(`/dashboard/machines/${part?.machineId}`)
  return { success: true, message: "Pieza eliminada exitosamente" }
}

export async function updatePartUsage(formData: FormData) {
  const id = Number(formData.get("id"))
  const additionalUsage = Number(formData.get("additionalUsage"))
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
  return { success: true, message: "Uso actualizado exitosamente", newStatus, statusChanged }
}

export async function replaceMachinePart(formData: FormData) {
  const partId = Number(formData.get("partId"))
  const newInventoryItemId = Number(formData.get("newInventoryItemId"))
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
}
