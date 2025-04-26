"use server"

import { revalidatePath } from "next/cache"
import type { UsageLog } from "@/types"
import { getInventoryItemById } from "@/app/actions/inventory"
import { createNotification } from "@/app/actions/notifications"

// Simulación de base de datos para registros de uso
let usageLogs: UsageLog[] = [
  {
    id: 1,
    equipo_id: 1,
    equipo_nombre: "Biseladora Automática",
    item_inventario_id: 7,
    item_inventario_nombre: "Disco de Corte",
    fecha: "2023-04-10",
    cantidad_usada: 500,
    unidad_de_uso: "Cortes",
    responsable: "Juan Pérez",
    comentarios: "Uso normal durante la semana",
    created_at: "2023-04-10T15:30:00",
  },
  {
    id: 2,
    equipo_id: 2,
    equipo_nombre: "Bloqueadora Digital",
    item_inventario_id: 4,
    item_inventario_nombre: "Cinta Adhesiva",
    fecha: "2023-04-11",
    cantidad_usada: 15,
    unidad_de_uso: "Unidades",
    responsable: "María López",
    comentarios: "Reemplazo de cinta adhesiva",
    created_at: "2023-04-11T10:15:00",
  },
  {
    id: 3,
    equipo_id: 3,
    equipo_nombre: "Trazadora Computarizada",
    item_inventario_id: 5,
    item_inventario_nombre: "Líquido Pulidor",
    fecha: "2023-04-12",
    cantidad_usada: 0.5,
    unidad_de_uso: "Litros",
    responsable: "Carlos Rodríguez",
    created_at: "2023-04-12T14:45:00",
  },
  {
    id: 4,
    equipo_id: 1,
    equipo_nombre: "Biseladora Automática",
    item_inventario_id: 7,
    item_inventario_nombre: "Disco de Corte",
    fecha: "2023-04-15",
    cantidad_usada: 18000,
    unidad_de_uso: "Cortes",
    responsable: "Juan Pérez",
    comentarios: "Uso intensivo",
    created_at: "2023-04-15T09:30:00",
  },
]

/**
 * Obtiene todos los registros de uso
 */
export async function getUsageLogs() {
  return usageLogs
}

/**
 * Obtiene un registro de uso por su ID
 */
export async function getUsageLogById(id: number) {
  return usageLogs.find((log) => log.id === id)
}

/**
 * Crea un nuevo registro de uso
 */
export async function createUsageLog(formData: FormData) {
  const equipo_id = Number(formData.get("equipo_id"))
  const item_inventario_id = Number(formData.get("item_inventario_id"))
  const cantidad_usada = Number(formData.get("cantidad_usada"))

  const newLog: UsageLog = {
    id: usageLogs.length > 0 ? Math.max(...usageLogs.map((log) => log.id)) + 1 : 1,
    equipo_id,
    equipo_nombre: formData.get("equipo_nombre") as string,
    item_inventario_id,
    item_inventario_nombre: formData.get("item_inventario_nombre") as string,
    fecha: formData.get("fecha") as string,
    cantidad_usada,
    unidad_de_uso: formData.get("unidad_de_uso") as string,
    responsable: formData.get("responsable") as string,
    comentarios: formData.get("comentarios") as string,
    created_at: new Date().toISOString(),
  }

  usageLogs.push(newLog)
  revalidatePath("/dashboard/usage-logs")

  // Verificar si el ítem tiene vida útil máxima y generar alertas si es necesario
  try {
    const inventoryItem = await getInventoryItemById(item_inventario_id)
    if (inventoryItem && inventoryItem.vida_util_maxima) {
      const usoAcumulado = await calcularUsoAcumulado(equipo_id, item_inventario_id)
      const porcentajeUso = (usoAcumulado / inventoryItem.vida_util_maxima) * 100

      if (porcentajeUso >= 100) {
        await createNotification({
          type: "usage_alert",
          title: "¡Alerta crítica de uso!",
          message: `El ítem ${inventoryItem.name} en ${newLog.equipo_nombre} ha alcanzado el 100% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}). Se requiere mantenimiento inmediato.`,
          severity: "high",
          relatedId: `${equipo_id}_${item_inventario_id}`,
        })
      } else if (porcentajeUso >= 75) {
        await createNotification({
          type: "usage_alert",
          title: "Alerta de uso",
          message: `El ítem ${inventoryItem.name} en ${newLog.equipo_nombre} está al ${porcentajeUso.toFixed(1)}% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}).`,
          severity: "medium",
          relatedId: `${equipo_id}_${item_inventario_id}`,
        })
      }
    }
  } catch (error) {
    console.error("Error al verificar vida útil:", error)
  }

  return { success: true, message: "Registro de uso creado exitosamente", log: newLog }
}

/**
 * Actualiza un registro de uso existente
 */
export async function updateUsageLog(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = usageLogs.findIndex((log) => log.id === id)

  if (index === -1) {
    return { success: false, message: "Registro de uso no encontrado" }
  }

  const oldLog = usageLogs[index]
  const equipo_id = Number(formData.get("equipo_id"))
  const item_inventario_id = Number(formData.get("item_inventario_id"))
  const cantidad_usada = Number(formData.get("cantidad_usada"))

  const updatedLog: UsageLog = {
    ...usageLogs[index],
    equipo_id,
    equipo_nombre: formData.get("equipo_nombre") as string,
    item_inventario_id,
    item_inventario_nombre: formData.get("item_inventario_nombre") as string,
    fecha: formData.get("fecha") as string,
    cantidad_usada,
    unidad_de_uso: formData.get("unidad_de_uso") as string,
    responsable: formData.get("responsable") as string,
    comentarios: formData.get("comentarios") as string,
  }

  usageLogs[index] = updatedLog
  revalidatePath("/dashboard/usage-logs")

  // Si cambió la cantidad o el ítem, verificar alertas
  if (oldLog.cantidad_usada !== cantidad_usada || oldLog.item_inventario_id !== item_inventario_id) {
    try {
      const inventoryItem = await getInventoryItemById(item_inventario_id)
      if (inventoryItem && inventoryItem.vida_util_maxima) {
        const usoAcumulado = await calcularUsoAcumulado(equipo_id, item_inventario_id)
        const porcentajeUso = (usoAcumulado / inventoryItem.vida_util_maxima) * 100

        if (porcentajeUso >= 100) {
          await createNotification({
            type: "usage_alert",
            title: "¡Alerta crítica de uso!",
            message: `El ítem ${inventoryItem.name} en ${updatedLog.equipo_nombre} ha alcanzado el 100% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}). Se requiere mantenimiento inmediato.`,
            severity: "high",
            relatedId: `${equipo_id}_${item_inventario_id}`,
          })
        } else if (porcentajeUso >= 75) {
          await createNotification({
            type: "usage_alert",
            title: "Alerta de uso",
            message: `El ítem ${inventoryItem.name} en ${updatedLog.equipo_nombre} está al ${porcentajeUso.toFixed(1)}% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}).`,
            severity: "medium",
            relatedId: `${equipo_id}_${item_inventario_id}`,
          })
        }
      }
    } catch (error) {
      console.error("Error al verificar vida útil:", error)
    }
  }

  return { success: true, message: "Registro de uso actualizado exitosamente", log: updatedLog }
}

/**
 * Elimina un registro de uso
 */
export async function deleteUsageLog(id: number) {
  const initialLength = usageLogs.length
  usageLogs = usageLogs.filter((log) => log.id !== id)

  if (usageLogs.length === initialLength) {
    return { success: false, message: "Registro de uso no encontrado" }
  }

  revalidatePath("/dashboard/usage-logs")
  return { success: true, message: "Registro de uso eliminado exitosamente" }
}

/**
 * Obtiene los registros de uso filtrados por equipo
 */
export async function getUsageLogsByEquipo(equipoId: number) {
  return usageLogs.filter((log) => log.equipo_id === equipoId)
}

/**
 * Obtiene los registros de uso filtrados por ítem de inventario
 */
export async function getUsageLogsByInventoryItem(itemId: number) {
  return usageLogs.filter((log) => log.item_inventario_id === itemId)
}

/**
 * Calcula el uso acumulado de un ítem de inventario en un equipo específico
 */
export async function calcularUsoAcumulado(equipoId: number, itemId: number): Promise<number> {
  const logs = usageLogs.filter((log) => log.equipo_id === equipoId && log.item_inventario_id === itemId)

  return logs.reduce((total, log) => total + log.cantidad_usada, 0)
}

/**
 * Obtiene el porcentaje de uso de un ítem de inventario en un equipo específico
 */
export async function calcularPorcentajeUso(equipoId: number, itemId: number): Promise<number | null> {
  try {
    const inventoryItem = await getInventoryItemById(itemId)
    if (!inventoryItem || !inventoryItem.vida_util_maxima) {
      return null
    }

    const usoAcumulado = await calcularUsoAcumulado(equipoId, itemId)
    return (usoAcumulado / inventoryItem.vida_util_maxima) * 100
  } catch (error) {
    console.error("Error al calcular porcentaje de uso:", error)
    return null
  }
}

/**
 * Obtiene información de uso para todos los ítems con vida útil máxima
 */
export async function obtenerInformacionDeUso() {
  // Obtener combinaciones únicas de equipo-ítem
  const combinaciones = usageLogs.reduce(
    (acc, log) => {
      const key = `${log.equipo_id}_${log.item_inventario_id}`
      if (!acc.some((item) => item.key === key)) {
        acc.push({
          key,
          equipo_id: log.equipo_id,
          equipo_nombre: log.equipo_nombre,
          item_inventario_id: log.item_inventario_id,
          item_inventario_nombre: log.item_inventario_nombre,
          unidad_de_uso: log.unidad_de_uso,
        })
      }
      return acc
    },
    [] as {
      key: string
      equipo_id: number
      equipo_nombre: string
      item_inventario_id: number
      item_inventario_nombre: string
      unidad_de_uso: string
    }[],
  )

  // Calcular uso acumulado y porcentaje para cada combinación
  const resultados = await Promise.all(
    combinaciones.map(async (combo) => {
      const item = await getInventoryItemById(combo.item_inventario_id)
      if (!item || !item.vida_util_maxima) {
        return null
      }

      const usoAcumulado = await calcularUsoAcumulado(combo.equipo_id, combo.item_inventario_id)
      const porcentajeUso = (usoAcumulado / item.vida_util_maxima) * 100

      return {
        ...combo,
        uso_acumulado: usoAcumulado,
        vida_util_maxima: item.vida_util_maxima,
        porcentaje_uso: porcentajeUso,
        requiere_mantenimiento: porcentajeUso >= 100,
        alerta: porcentajeUso >= 75,
      }
    }),
  )

  // Filtrar resultados nulos (ítems sin vida útil máxima)
  return resultados.filter(Boolean)
}

/**
 * Registra un mantenimiento para un ítem de inventario en un equipo específico
 */
export async function registrarMantenimiento(formData: FormData) {
  const equipo_id = Number(formData.get("equipo_id"))
  const item_inventario_id = Number(formData.get("item_inventario_id"))
  const fecha = formData.get("fecha") as string
  const responsable = formData.get("responsable") as string
  const comentarios = formData.get("comentarios") as string

  // Reiniciar el contador de uso para este ítem en este equipo
  // En una implementación real, esto podría implicar crear un registro de mantenimiento
  // y luego ajustar los contadores de uso

  // Crear un registro de uso con cantidad negativa para "reiniciar" el contador
  const usoAcumulado = await calcularUsoAcumulado(equipo_id, item_inventario_id)

  const newLog: UsageLog = {
    id: usageLogs.length > 0 ? Math.max(...usageLogs.map((log) => log.id)) + 1 : 1,
    equipo_id,
    equipo_nombre: formData.get("equipo_nombre") as string,
    item_inventario_id,
    item_inventario_nombre: formData.get("item_inventario_nombre") as string,
    fecha,
    cantidad_usada: -usoAcumulado, // Cantidad negativa para reiniciar el contador
    unidad_de_uso: formData.get("unidad_de_uso") as string,
    responsable,
    comentarios: `Mantenimiento realizado: ${comentarios}`,
    created_at: new Date().toISOString(),
  }

  usageLogs.push(newLog)

  // Crear notificación de mantenimiento realizado
  await createNotification({
    type: "maintenance",
    title: "Mantenimiento registrado",
    message: `Se ha registrado un mantenimiento para ${newLog.item_inventario_nombre} en ${newLog.equipo_nombre} por ${responsable}.`,
    severity: "low",
    relatedId: `${equipo_id}_${item_inventario_id}`,
  })

  revalidatePath("/dashboard/usage-logs")
  return { success: true, message: "Mantenimiento registrado exitosamente" }
}
