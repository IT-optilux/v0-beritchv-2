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
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import type { UsageLog } from "@/types"
import { inventoryService } from "./inventory-service"
import { notificationService } from "./notification-service"

export const usageLogService = {
  /**
   * Obtiene todos los registros de uso
   */
  async getAll(): Promise<UsageLog[]> {
    try {
      const logsRef = collection(db, "usage_logs")
      const q = query(logsRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha?.toDate().toISOString().split("T")[0] || null,
            created_at: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as UsageLog,
      )
    } catch (error) {
      console.error("Error al obtener registros de uso:", error)
      throw new Error("No se pudieron obtener los registros de uso")
    }
  },

  /**
   * Obtiene un registro de uso por su ID
   */
  async getById(id: string): Promise<UsageLog | null> {
    try {
      const logRef = doc(db, "usage_logs", id)
      const snapshot = await getDoc(logRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        id: snapshot.id,
        ...data,
        fecha: data.fecha?.toDate().toISOString().split("T")[0] || null,
        created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as UsageLog
    } catch (error) {
      console.error(`Error al obtener registro de uso con ID ${id}:`, error)
      throw new Error(`No se pudo obtener el registro de uso con ID ${id}`)
    }
  },

  /**
   * Crea un nuevo registro de uso
   */
  async create(log: Omit<UsageLog, "id" | "created_at">): Promise<UsageLog> {
    try {
      const logsRef = collection(db, "usage_logs")

      const logToCreate = {
        ...log,
        fecha: log.fecha ? Timestamp.fromDate(new Date(log.fecha)) : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(logsRef, logToCreate)
      const newLog = await getDoc(docRef)

      if (!newLog.exists()) {
        throw new Error("Error al crear el registro de uso")
      }

      const data = newLog.data()
      const createdLog = {
        id: newLog.id,
        ...data,
        fecha: data.fecha?.toDate().toISOString().split("T")[0] || null,
        created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as UsageLog

      // Verificar si el ítem tiene vida útil máxima y generar alertas si es necesario
      try {
        const inventoryItem = await inventoryService.getById(log.item_inventario_id.toString())
        if (inventoryItem && inventoryItem.vida_util_maxima) {
          const usoAcumulado = await this.calcularUsoAcumulado(
            log.equipo_id.toString(),
            log.item_inventario_id.toString(),
          )
          const porcentajeUso = (usoAcumulado / inventoryItem.vida_util_maxima) * 100

          if (porcentajeUso >= 100) {
            await notificationService.create({
              type: "usage_alert",
              title: "¡Alerta crítica de uso!",
              message: `El ítem ${inventoryItem.name} en ${log.equipo_nombre} ha alcanzado el 100% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}). Se requiere mantenimiento inmediato.`,
              severity: "high",
              relatedId: `${log.equipo_id}_${log.item_inventario_id}`,
              read: false,
            })
          } else if (porcentajeUso >= 75) {
            await notificationService.create({
              type: "usage_alert",
              title: "Alerta de uso",
              message: `El ítem ${inventoryItem.name} en ${log.equipo_nombre} está al ${porcentajeUso.toFixed(1)}% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}).`,
              severity: "medium",
              relatedId: `${log.equipo_id}_${log.item_inventario_id}`,
              read: false,
            })
          }
        }
      } catch (error) {
        console.error("Error al verificar vida útil:", error)
      }

      return createdLog
    } catch (error) {
      console.error("Error al crear registro de uso:", error)
      throw new Error("No se pudo crear el registro de uso")
    }
  },

  /**
   * Actualiza un registro de uso existente
   */
  async update(id: string, log: Partial<UsageLog>): Promise<UsageLog> {
    try {
      const logRef = doc(db, "usage_logs", id)
      const snapshot = await getDoc(logRef)

      if (!snapshot.exists()) {
        throw new Error("Registro de uso no encontrado")
      }

      const oldLog = snapshot.data() as UsageLog

      const updateData = {
        ...log,
        fecha: log.fecha ? Timestamp.fromDate(new Date(log.fecha)) : undefined,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(logRef, updateData)

      // Obtener el registro actualizado
      const updatedSnapshot = await getDoc(logRef)
      const data = updatedSnapshot.data()

      const updatedLog = {
        id: updatedSnapshot.id,
        ...data,
        fecha: data.fecha?.toDate().toISOString().split("T")[0] || null,
        created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as UsageLog

      // Si cambió la cantidad o el ítem, verificar alertas
      if (
        (log.cantidad_usada !== undefined && log.cantidad_usada !== oldLog.cantidad_usada) ||
        (log.item_inventario_id !== undefined && log.item_inventario_id !== oldLog.item_inventario_id)
      ) {
        try {
          const inventoryItem = await inventoryService.getById(
            (log.item_inventario_id || oldLog.item_inventario_id).toString(),
          )
          if (inventoryItem && inventoryItem.vida_util_maxima) {
            const usoAcumulado = await this.calcularUsoAcumulado(
              (log.equipo_id || oldLog.equipo_id).toString(),
              (log.item_inventario_id || oldLog.item_inventario_id).toString(),
            )
            const porcentajeUso = (usoAcumulado / inventoryItem.vida_util_maxima) * 100

            if (porcentajeUso >= 100) {
              await notificationService.create({
                type: "usage_alert",
                title: "¡Alerta crítica de uso!",
                message: `El ítem ${inventoryItem.name} en ${updatedLog.equipo_nombre} ha alcanzado el 100% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}). Se requiere mantenimiento inmediato.`,
                severity: "high",
                relatedId: `${updatedLog.equipo_id}_${updatedLog.item_inventario_id}`,
                read: false,
              })
            } else if (porcentajeUso >= 75) {
              await notificationService.create({
                type: "usage_alert",
                title: "Alerta de uso",
                message: `El ítem ${inventoryItem.name} en ${updatedLog.equipo_nombre} está al ${porcentajeUso.toFixed(1)}% de su vida útil (${usoAcumulado} de ${inventoryItem.vida_util_maxima} ${inventoryItem.unidad_de_uso}).`,
                severity: "medium",
                relatedId: `${updatedLog.equipo_id}_${updatedLog.item_inventario_id}`,
                read: false,
              })
            }
          }
        } catch (error) {
          console.error("Error al verificar vida útil:", error)
        }
      }

      return updatedLog
    } catch (error) {
      console.error(`Error al actualizar registro de uso con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar el registro de uso con ID ${id}`)
    }
  },

  /**
   * Elimina un registro de uso
   */
  async delete(id: string): Promise<void> {
    try {
      const logRef = doc(db, "usage_logs", id)
      await deleteDoc(logRef)
    } catch (error) {
      console.error(`Error al eliminar registro de uso con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar el registro de uso con ID ${id}`)
    }
  },

  /**
   * Obtiene los registros de uso filtrados por equipo
   */
  async getUsageLogsByEquipo(equipoId: string): Promise<UsageLog[]> {
    try {
      const logsRef = collection(db, "usage_logs")
      const q = query(logsRef, where("equipo_id", "==", Number(equipoId)), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha?.toDate().toISOString().split("T")[0] || null,
            created_at: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as UsageLog,
      )
    } catch (error) {
      console.error(`Error al obtener registros de uso para el equipo ${equipoId}:`, error)
      throw new Error(`No se pudieron obtener los registros de uso para el equipo ${equipoId}`)
    }
  },

  /**
   * Obtiene los registros de uso filtrados por ítem de inventario
   */
  async getUsageLogsByInventoryItem(itemId: string): Promise<UsageLog[]> {
    try {
      const logsRef = collection(db, "usage_logs")
      const q = query(logsRef, where("item_inventario_id", "==", Number(itemId)), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha?.toDate().toISOString().split("T")[0] || null,
            created_at: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as UsageLog,
      )
    } catch (error) {
      console.error(`Error al obtener registros de uso para el ítem ${itemId}:`, error)
      throw new Error(`No se pudieron obtener los registros de uso para el ítem ${itemId}`)
    }
  },

  /**
   * Calcula el uso acumulado de un ítem de inventario en un equipo específico
   */
  async calcularUsoAcumulado(equipoId: string, itemId: string): Promise<number> {
    try {
      const logsRef = collection(db, "usage_logs")
      const q = query(
        logsRef,
        where("equipo_id", "==", Number(equipoId)),
        where("item_inventario_id", "==", Number(itemId)),
      )
      const snapshot = await getDocs(q)

      const logs = snapshot.docs.map((doc) => doc.data() as UsageLog)
      return logs.reduce((total, log) => total + log.cantidad_usada, 0)
    } catch (error) {
      console.error(`Error al calcular uso acumulado para equipo ${equipoId} e ítem ${itemId}:`, error)
      throw new Error(`No se pudo calcular el uso acumulado para equipo ${equipoId} e ítem ${itemId}`)
    }
  },

  /**
   * Obtiene el porcentaje de uso de un ítem de inventario en un equipo específico
   */
  async calcularPorcentajeUso(equipoId: string, itemId: string): Promise<number | null> {
    try {
      const inventoryItem = await inventoryService.getById(itemId)
      if (!inventoryItem || !inventoryItem.vida_util_maxima) {
        return null
      }

      const usoAcumulado = await this.calcularUsoAcumulado(equipoId, itemId)
      return (usoAcumulado / inventoryItem.vida_util_maxima) * 100
    } catch (error) {
      console.error(`Error al calcular porcentaje de uso para equipo ${equipoId} e ítem ${itemId}:`, error)
      throw new Error(`No se pudo calcular el porcentaje de uso para equipo ${equipoId} e ítem ${itemId}`)
    }
  },

  /**
   * Registra un mantenimiento para un ítem de inventario en un equipo específico
   */
  async registrarMantenimiento(data: {
    equipo_id: string
    equipo_nombre: string
    item_inventario_id: string
    item_inventario_nombre: string
    fecha: string
    unidad_de_uso: string
    responsable: string
    comentarios: string
  }): Promise<void> {
    try {
      // Obtener uso acumulado actual
      const usoAcumulado = await this.calcularUsoAcumulado(data.equipo_id, data.item_inventario_id)

      // Crear un registro de uso con cantidad negativa para "reiniciar" el contador
      await this.create({
        equipo_id: Number(data.equipo_id),
        equipo_nombre: data.equipo_nombre,
        item_inventario_id: Number(data.item_inventario_id),
        item_inventario_nombre: data.item_inventario_nombre,
        fecha: data.fecha,
        cantidad_usada: -usoAcumulado,
        unidad_de_uso: data.unidad_de_uso,
        responsable: data.responsable,
        comentarios: `Mantenimiento realizado: ${data.comentarios}`,
      })

      // Crear notificación de mantenimiento
      await notificationService.create({
        type: "maintenance",
        title: "Mantenimiento registrado",
        message: `Se ha registrado un mantenimiento para ${data.item_inventario_nombre} en ${data.equipo_nombre} por ${data.responsable}.`,
        severity: "low",
        relatedId: `${data.equipo_id}_${data.item_inventario_id}`,
        read: false,
      })
    } catch (error) {
      console.error("Error al registrar mantenimiento:", error)
      throw new Error("No se pudo registrar el mantenimiento")
    }
  },

  /**
   * Obtiene información de uso para todos los ítems con vida útil máxima
   */
  async obtenerInformacionDeUso() {
    try {
      // Obtener todos los registros de uso
      const logs = await this.getAll()

      // Obtener combinaciones únicas de equipo-ítem
      const combinacionesMap = new Map()

      for (const log of logs) {
        const key = `${log.equipo_id}_${log.item_inventario_id}`

        if (!combinacionesMap.has(key)) {
          combinacionesMap.set(key, {
            key,
            equipo_id: log.equipo_id,
            equipo_nombre: log.equipo_nombre,
            item_inventario_id: log.item_inventario_id,
            item_inventario_nombre: log.item_inventario_nombre,
            unidad_de_uso: log.unidad_de_uso,
          })
        }
      }

      const combinaciones = Array.from(combinacionesMap.values())

      // Calcular uso acumulado y porcentaje para cada combinación
      const resultados = []

      for (const combo of combinaciones) {
        const inventoryItem = await inventoryService.getById(combo.item_inventario_id.toString())

        if (!inventoryItem || !inventoryItem.vida_util_maxima) {
          continue
        }

        const usoAcumulado = await this.calcularUsoAcumulado(
          combo.equipo_id.toString(),
          combo.item_inventario_id.toString(),
        )

        const porcentajeUso = (usoAcumulado / inventoryItem.vida_util_maxima) * 100

        resultados.push({
          ...combo,
          uso_acumulado: usoAcumulado,
          vida_util_maxima: inventoryItem.vida_util_maxima,
          porcentaje_uso: porcentajeUso,
          requiere_mantenimiento: porcentajeUso >= 100,
          alerta: porcentajeUso >= 75,
        })
      }

      return resultados
    } catch (error) {
      console.error("Error al obtener información de uso:", error)
      throw new Error("No se pudo obtener la información de uso")
    }
  },
}
