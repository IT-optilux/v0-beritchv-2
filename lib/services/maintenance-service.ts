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
import type { Maintenance, MaintenancePart } from "@/types"
import { inventoryService } from "./inventory-service"
import { notificationService } from "./notification-service"

export const maintenanceService = {
  /**
   * Obtiene todos los mantenimientos
   */
  async getAll(): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, "maintenance")
      const q = query(maintenanceRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate().toISOString().split("T")[0] || null,
            endDate: doc.data().endDate?.toDate().toISOString().split("T")[0] || null,
          }) as Maintenance,
      )
    } catch (error) {
      console.error("Error al obtener mantenimientos:", error)
      throw new Error("No se pudieron obtener los mantenimientos")
    }
  },

  /**
   * Obtiene un mantenimiento por su ID
   */
  async getById(id: string): Promise<Maintenance | null> {
    try {
      const maintenanceRef = doc(db, "maintenance", id)
      const snapshot = await getDoc(maintenanceRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        id: snapshot.id,
        ...data,
        startDate: data.startDate?.toDate().toISOString().split("T")[0] || null,
        endDate: data.endDate?.toDate().toISOString().split("T")[0] || null,
      } as Maintenance
    } catch (error) {
      console.error(`Error al obtener mantenimiento con ID ${id}:`, error)
      throw new Error(`No se pudo obtener el mantenimiento con ID ${id}`)
    }
  },

  /**
   * Crea un nuevo mantenimiento
   */
  async create(maintenance: Omit<Maintenance, "id">): Promise<Maintenance> {
    try {
      const maintenanceRef = collection(db, "maintenance")

      const maintenanceToCreate = {
        ...maintenance,
        startDate: maintenance.startDate ? Timestamp.fromDate(new Date(maintenance.startDate)) : null,
        endDate: maintenance.endDate ? Timestamp.fromDate(new Date(maintenance.endDate)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(maintenanceRef, maintenanceToCreate)
      const newMaintenance = await getDoc(docRef)

      if (!newMaintenance.exists()) {
        throw new Error("Error al crear el mantenimiento")
      }

      const data = newMaintenance.data()

      // Crear notificación
      await notificationService.create({
        type: "maintenance",
        title: `Nuevo mantenimiento ${maintenance.maintenanceType.toLowerCase()}`,
        message: `Se ha programado un mantenimiento ${maintenance.maintenanceType.toLowerCase()} para ${maintenance.machineName} el ${new Date(maintenance.startDate || "").toLocaleDateString()}`,
        severity: "medium",
        relatedId: maintenance.machineId.toString(),
        read: false,
      })

      return {
        id: newMaintenance.id,
        ...data,
        startDate: data.startDate?.toDate().toISOString().split("T")[0] || null,
        endDate: data.endDate?.toDate().toISOString().split("T")[0] || null,
      } as Maintenance
    } catch (error) {
      console.error("Error al crear mantenimiento:", error)
      throw new Error("No se pudo crear el mantenimiento")
    }
  },

  /**
   * Actualiza un mantenimiento existente
   */
  async update(id: string, maintenance: Partial<Maintenance>): Promise<Maintenance> {
    try {
      const maintenanceRef = doc(db, "maintenance", id)
      const snapshot = await getDoc(maintenanceRef)

      if (!snapshot.exists()) {
        throw new Error("Mantenimiento no encontrado")
      }

      const currentMaintenance = snapshot.data() as Maintenance

      const updateData = {
        ...maintenance,
        startDate: maintenance.startDate ? Timestamp.fromDate(new Date(maintenance.startDate)) : undefined,
        endDate: maintenance.endDate ? Timestamp.fromDate(new Date(maintenance.endDate)) : undefined,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(maintenanceRef, updateData)

      // Obtener el mantenimiento actualizado
      const updatedSnapshot = await getDoc(maintenanceRef)
      const data = updatedSnapshot.data()

      // Si el estado cambió a "Completado", crear notificación
      if (maintenance.status === "Completado" && currentMaintenance.status !== "Completado") {
        await notificationService.create({
          type: "maintenance_completed",
          title: "Mantenimiento completado",
          message: `El mantenimiento ${currentMaintenance.maintenanceType.toLowerCase()} para ${currentMaintenance.machineName} ha sido completado.`,
          severity: "low",
          relatedId: currentMaintenance.machineId.toString(),
          read: false,
        })
      }

      return {
        id: updatedSnapshot.id,
        ...data,
        startDate: data.startDate?.toDate().toISOString().split("T")[0] || null,
        endDate: data.endDate?.toDate().toISOString().split("T")[0] || null,
      } as Maintenance
    } catch (error) {
      console.error(`Error al actualizar mantenimiento con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar el mantenimiento con ID ${id}`)
    }
  },

  /**
   * Elimina un mantenimiento
   */
  async delete(id: string): Promise<void> {
    try {
      const maintenanceRef = doc(db, "maintenance", id)

      // Obtener el mantenimiento antes de eliminarlo
      const snapshot = await getDoc(maintenanceRef)

      if (!snapshot.exists()) {
        throw new Error("Mantenimiento no encontrado")
      }

      const maintenance = snapshot.data() as Maintenance

      // Eliminar también los repuestos asociados
      const partsRef = collection(db, "maintenance_parts")
      const q = query(partsRef, where("mantenimiento_id", "==", id))
      const partsSnapshot = await getDocs(q)

      // Eliminar las partes en un batch
      const batch = db.batch()
      partsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Eliminar el mantenimiento
      batch.delete(maintenanceRef)

      await batch.commit()

      // Crear notificación
      await notificationService.create({
        type: "maintenance_deleted",
        title: "Mantenimiento eliminado",
        message: `El mantenimiento ${maintenance.maintenanceType.toLowerCase()} para ${maintenance.machineName} ha sido eliminado.`,
        severity: "medium",
        relatedId: maintenance.machineId.toString(),
        read: false,
      })
    } catch (error) {
      console.error(`Error al eliminar mantenimiento con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar el mantenimiento con ID ${id}`)
    }
  },

  /**
   * Obtiene mantenimientos por máquina
   */
  async getByMachineId(machineId: string): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, "maintenance")
      const q = query(maintenanceRef, where("machineId", "==", Number(machineId)), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate().toISOString().split("T")[0] || null,
            endDate: doc.data().endDate?.toDate().toISOString().split("T")[0] || null,
          }) as Maintenance,
      )
    } catch (error) {
      console.error(`Error al obtener mantenimientos para la máquina ${machineId}:`, error)
      throw new Error(`No se pudieron obtener los mantenimientos para la máquina ${machineId}`)
    }
  },

  /**
   * Obtiene mantenimientos por estado
   */
  async getByStatus(status: string): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, "maintenance")
      const q = query(maintenanceRef, where("status", "==", status), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate().toISOString().split("T")[0] || null,
            endDate: doc.data().endDate?.toDate().toISOString().split("T")[0] || null,
          }) as Maintenance,
      )
    } catch (error) {
      console.error(`Error al obtener mantenimientos por estado ${status}:`, error)
      throw new Error(`No se pudieron obtener los mantenimientos por estado ${status}`)
    }
  },

  /**
   * Obtiene mantenimientos próximos
   */
  async getUpcoming(days = 7): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, "maintenance")
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + days)

      const todayTimestamp = Timestamp.fromDate(today)
      const futureDateTimestamp = Timestamp.fromDate(futureDate)

      const q = query(
        maintenanceRef,
        where("startDate", ">=", todayTimestamp),
        where("startDate", "<=", futureDateTimestamp),
        where("status", "==", "Programado"),
      )

      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate().toISOString().split("T")[0] || null,
            endDate: doc.data().endDate?.toDate().toISOString().split("T")[0] || null,
          }) as Maintenance,
      )
    } catch (error) {
      console.error("Error al obtener mantenimientos próximos:", error)
      throw new Error("No se pudieron obtener los mantenimientos próximos")
    }
  },

  /**
   * Obtiene repuestos utilizados en un mantenimiento
   */
  async getMaintenancePartsByMaintenanceId(maintenanceId: string): Promise<MaintenancePart[]> {
    try {
      const partsRef = collection(db, "maintenance_parts")
      const q = query(partsRef, where("mantenimiento_id", "==", maintenanceId))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            fecha_registro: doc.data().fecha_registro?.toDate().toISOString().split("T")[0] || null,
          }) as unknown as MaintenancePart,
      )
    } catch (error) {
      console.error(`Error al obtener repuestos para el mantenimiento ${maintenanceId}:`, error)
      throw new Error(`No se pudieron obtener los repuestos para el mantenimiento ${maintenanceId}`)
    }
  },

  /**
   * Registra un repuesto utilizado en un mantenimiento
   */
  async addMaintenancePart(part: Omit<MaintenancePart, "id">): Promise<MaintenancePart> {
    try {
      // Verificar que el ítem de inventario existe y tiene suficiente stock
      const inventoryItem = await inventoryService.getById(part.item_inventario_id.toString())

      if (!inventoryItem) {
        throw new Error("El ítem de inventario especificado no existe")
      }

      if (inventoryItem.quantity < part.cantidad_utilizada) {
        throw new Error(
          `Stock insuficiente. Disponible: ${inventoryItem.quantity}, Solicitado: ${part.cantidad_utilizada}`,
        )
      }

      // Crear el registro de repuesto utilizado
      const partsRef = collection(db, "maintenance_parts")

      const partToCreate = {
        ...part,
        fecha_registro: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(partsRef, partToCreate)
      const newPart = await getDoc(docRef)

      if (!newPart.exists()) {
        throw new Error("Error al registrar el repuesto")
      }

      // Descontar la cantidad del inventario
      await inventoryService.adjustQuantity(part.item_inventario_id.toString(), -part.cantidad_utilizada)

      // Actualizar el costo total del mantenimiento
      const maintenanceRef = doc(db, "maintenance", part.mantenimiento_id.toString())
      const maintenanceSnapshot = await getDoc(maintenanceRef)

      if (maintenanceSnapshot.exists()) {
        const maintenance = maintenanceSnapshot.data() as Maintenance
        const currentCost = maintenance.cost || 0

        await updateDoc(maintenanceRef, {
          cost: currentCost + part.total_costo,
          updatedAt: serverTimestamp(),
        })
      }

      const data = newPart.data()
      return {
        id: newPart.id,
        ...data,
        fecha_registro: data.fecha_registro?.toDate().toISOString().split("T")[0] || null,
      } as unknown as MaintenancePart
    } catch (error) {
      console.error("Error al registrar repuesto:", error)
      throw new Error("No se pudo registrar el repuesto")
    }
  },

  /**
   * Elimina un repuesto utilizado
   */
  async deleteMaintenancePart(id: string): Promise<void> {
    try {
      const partRef = doc(db, "maintenance_parts", id)
      const snapshot = await getDoc(partRef)

      if (!snapshot.exists()) {
        throw new Error("Repuesto no encontrado")
      }

      const part = snapshot.data() as unknown as MaintenancePart

      // Devolver la cantidad al inventario
      await inventoryService.adjustQuantity(part.item_inventario_id.toString(), part.cantidad_utilizada)

      // Actualizar el costo total del mantenimiento
      const maintenanceRef = doc(db, "maintenance", part.mantenimiento_id.toString())
      const maintenanceSnapshot = await getDoc(maintenanceRef)

      if (maintenanceSnapshot.exists()) {
        const maintenance = maintenanceSnapshot.data() as Maintenance
        const currentCost = maintenance.cost || 0

        await updateDoc(maintenanceRef, {
          cost: Math.max(0, currentCost - part.total_costo),
          updatedAt: serverTimestamp(),
        })
      }

      // Eliminar el registro
      await deleteDoc(partRef)
    } catch (error) {
      console.error(`Error al eliminar repuesto con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar el repuesto con ID ${id}`)
    }
  },
}
