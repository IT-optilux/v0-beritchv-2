"use server"

import { getMaintenances, getMaintenancePartsByMaintenanceId } from "@/app/actions/maintenance"
import { getUsageLogs } from "@/app/actions/usage-logs"
import { getMachineById } from "@/app/actions/machines"
import { getInventoryItemById } from "@/app/actions/inventory"
import type { Maintenance, MaintenancePart } from "@/types"

// Función para obtener el historial completo de un equipo
export async function getMachineHistory(machineId: number) {
  // Obtener información del equipo
  const machine = await getMachineById(machineId)
  if (!machine) {
    return { success: false, message: "Equipo no encontrado" }
  }

  // Obtener registros de uso del equipo
  const allUsageLogs = await getUsageLogs()
  const usageLogs = allUsageLogs.filter((log) => log.equipo_id === machineId)

  // Obtener mantenimientos del equipo
  const allMaintenances = await getMaintenances()
  const maintenances = allMaintenances.filter((maintenance) => maintenance.machineId === machineId)

  // Obtener repuestos utilizados en los mantenimientos
  const maintenanceParts: MaintenancePart[] = []
  for (const maintenance of maintenances) {
    const parts = await getMaintenancePartsByMaintenanceId(maintenance.id)
    maintenanceParts.push(...parts)
  }

  // Calcular estadísticas
  const totalParts = maintenanceParts.reduce((sum, part) => sum + part.cantidad_utilizada, 0)
  const totalCost =
    maintenanceParts.reduce((sum, part) => sum + part.total_costo, 0) +
    maintenances.reduce((sum, maintenance) => sum + (maintenance.cost || 0), 0)

  return {
    success: true,
    machine,
    usageLogs,
    maintenances,
    maintenanceParts,
    stats: {
      totalParts,
      totalCost,
      totalMaintenances: maintenances.length,
      totalUsageLogs: usageLogs.length,
    },
  }
}

// Función para obtener el historial completo de un ítem de inventario
export async function getInventoryItemHistory(itemId: number) {
  // Obtener información del ítem
  const item = await getInventoryItemById(itemId)
  if (!item) {
    return { success: false, message: "Ítem de inventario no encontrado" }
  }

  // Obtener registros de uso del ítem
  const allUsageLogs = await getUsageLogs()
  const usageLogs = allUsageLogs.filter((log) => log.item_inventario_id === itemId)

  // Obtener todos los mantenimientos
  const allMaintenances = await getMaintenances()

  // Obtener repuestos utilizados que corresponden a este ítem
  const allMaintenanceParts: { maintenance: Maintenance; part: MaintenancePart }[] = []

  for (const maintenance of allMaintenances) {
    const parts = await getMaintenancePartsByMaintenanceId(maintenance.id)
    const itemParts = parts.filter((part) => part.item_inventario_id === itemId)

    for (const part of itemParts) {
      allMaintenanceParts.push({
        maintenance,
        part,
      })
    }
  }

  // Calcular estadísticas
  const totalUsed = usageLogs.reduce((sum, log) => sum + log.cantidad_usada, 0)
  const totalUsedInMaintenance = allMaintenanceParts.reduce((sum, { part }) => sum + part.cantidad_utilizada, 0)
  const totalCost = allMaintenanceParts.reduce((sum, { part }) => sum + part.total_costo, 0)

  return {
    success: true,
    item,
    usageLogs,
    maintenanceParts: allMaintenanceParts,
    stats: {
      totalUsed,
      totalUsedInMaintenance,
      totalCost,
      totalUsageLogs: usageLogs.length,
      totalMaintenances: allMaintenanceParts.length,
    },
  }
}

// Función para filtrar los datos de historial por fecha y responsable
export async function filterHistoryData(data: any[], startDate?: string, endDate?: string, responsible?: string) {
  return data.filter((item) => {
    // Determinar qué campo de fecha usar
    const itemDate = item.fecha || item.startDate || item.fecha_registro || ""

    // Filtrar por fecha de inicio
    if (startDate && itemDate < startDate) {
      return false
    }

    // Filtrar por fecha de fin
    if (endDate && itemDate > endDate) {
      return false
    }

    // Filtrar por responsable
    if (responsible) {
      const itemResponsible = item.responsable || item.technician || ""
      if (!itemResponsible.toLowerCase().includes(responsible.toLowerCase())) {
        return false
      }
    }

    return true
  })
}
