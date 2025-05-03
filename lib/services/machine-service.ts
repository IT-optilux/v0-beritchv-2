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
import type { Machine, MachinePart } from "@/types"
import { notificationService } from "./notification-service"

export const machineService = {
  /**
   * Obtiene todas las máquinas
   */
  async getAll(): Promise<Machine[]> {
    try {
      const machinesRef = collection(db, "machines")
      const q = query(machinesRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            lastMaintenance: doc.data().lastMaintenance?.toDate().toISOString().split("T")[0] || null,
            nextMaintenance: doc.data().nextMaintenance?.toDate().toISOString().split("T")[0] || null,
            purchaseDate: doc.data().purchaseDate?.toDate().toISOString().split("T")[0] || null,
          }) as Machine,
      )
    } catch (error) {
      console.error("Error al obtener máquinas:", error)
      throw new Error("No se pudieron obtener las máquinas")
    }
  },

  /**
   * Obtiene una máquina por su ID
   */
  async getById(id: string): Promise<Machine | null> {
    try {
      const machineRef = doc(db, "machines", id)
      const snapshot = await getDoc(machineRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        id: snapshot.id,
        ...data,
        lastMaintenance: data.lastMaintenance?.toDate().toISOString().split("T")[0] || null,
        nextMaintenance: data.nextMaintenance?.toDate().toISOString().split("T")[0] || null,
        purchaseDate: data.purchaseDate?.toDate().toISOString().split("T")[0] || null,
      } as Machine
    } catch (error) {
      console.error(`Error al obtener máquina con ID ${id}:`, error)
      throw new Error(`No se pudo obtener la máquina con ID ${id}`)
    }
  },

  /**
   * Crea una nueva máquina
   */
  async create(machine: Omit<Machine, "id">): Promise<Machine> {
    try {
      const machinesRef = collection(db, "machines")

      // Convertir fechas a Timestamp
      const machineToCreate = {
        ...machine,
        lastMaintenance: machine.lastMaintenance ? Timestamp.fromDate(new Date(machine.lastMaintenance)) : null,
        nextMaintenance: machine.nextMaintenance ? Timestamp.fromDate(new Date(machine.nextMaintenance)) : null,
        purchaseDate: machine.purchaseDate ? Timestamp.fromDate(new Date(machine.purchaseDate)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(machinesRef, machineToCreate)
      const newMachine = await getDoc(docRef)

      if (!newMachine.exists()) {
        throw new Error("Error al crear la máquina")
      }

      const data = newMachine.data()
      return {
        id: newMachine.id,
        ...data,
        lastMaintenance: data.lastMaintenance?.toDate().toISOString().split("T")[0] || null,
        nextMaintenance: data.nextMaintenance?.toDate().toISOString().split("T")[0] || null,
        purchaseDate: data.purchaseDate?.toDate().toISOString().split("T")[0] || null,
      } as Machine
    } catch (error) {
      console.error("Error al crear máquina:", error)
      throw new Error("No se pudo crear la máquina")
    }
  },

  /**
   * Actualiza una máquina existente
   */
  async update(id: string, machine: Partial<Machine>): Promise<Machine> {
    try {
      const machineRef = doc(db, "machines", id)
      const snapshot = await getDoc(machineRef)

      if (!snapshot.exists()) {
        throw new Error("Máquina no encontrada")
      }

      // Convertir fechas a Timestamp
      const updateData = {
        ...machine,
        lastMaintenance: machine.lastMaintenance ? Timestamp.fromDate(new Date(machine.lastMaintenance)) : undefined,
        nextMaintenance: machine.nextMaintenance ? Timestamp.fromDate(new Date(machine.nextMaintenance)) : undefined,
        purchaseDate: machine.purchaseDate ? Timestamp.fromDate(new Date(machine.purchaseDate)) : undefined,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(machineRef, updateData)

      // Obtener la máquina actualizada
      const updatedSnapshot = await getDoc(machineRef)
      const data = updatedSnapshot.data()

      return {
        id: updatedSnapshot.id,
        ...data,
        lastMaintenance: data.lastMaintenance?.toDate().toISOString().split("T")[0] || null,
        nextMaintenance: data.nextMaintenance?.toDate().toISOString().split("T")[0] || null,
        purchaseDate: data.purchaseDate?.toDate().toISOString().split("T")[0] || null,
      } as Machine
    } catch (error) {
      console.error(`Error al actualizar máquina con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar la máquina con ID ${id}`)
    }
  },

  /**
   * Elimina una máquina
   */
  async delete(id: string): Promise<void> {
    try {
      const machineRef = doc(db, "machines", id)

      // Eliminar también todas las piezas asociadas a esta máquina
      const partsRef = collection(db, "machine_parts")
      const q = query(partsRef, where("machineId", "==", id))
      const snapshot = await getDocs(q)

      // Eliminar las piezas en un batch
      const batch = db.batch()
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Eliminar la máquina
      batch.delete(machineRef)

      await batch.commit()
    } catch (error) {
      console.error(`Error al eliminar máquina con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar la máquina con ID ${id}`)
    }
  },

  /**
   * Obtiene máquinas por estado
   */
  async getByStatus(status: string): Promise<Machine[]> {
    try {
      const machinesRef = collection(db, "machines")
      const q = query(machinesRef, where("status", "==", status))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            lastMaintenance: doc.data().lastMaintenance?.toDate().toISOString().split("T")[0] || null,
            nextMaintenance: doc.data().nextMaintenance?.toDate().toISOString().split("T")[0] || null,
            purchaseDate: doc.data().purchaseDate?.toDate().toISOString().split("T")[0] || null,
          }) as Machine,
      )
    } catch (error) {
      console.error(`Error al obtener máquinas por estado ${status}:`, error)
      throw new Error(`No se pudieron obtener las máquinas por estado ${status}`)
    }
  },

  /**
   * Obtiene máquinas con mantenimiento próximo
   */
  async getUpcomingMaintenance(days = 7): Promise<Machine[]> {
    try {
      const machinesRef = collection(db, "machines")
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + days)

      const todayTimestamp = Timestamp.fromDate(today)
      const futureDateTimestamp = Timestamp.fromDate(futureDate)

      const q = query(
        machinesRef,
        where("nextMaintenance", ">=", todayTimestamp),
        where("nextMaintenance", "<=", futureDateTimestamp),
      )

      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            lastMaintenance: doc.data().lastMaintenance?.toDate().toISOString().split("T")[0] || null,
            nextMaintenance: doc.data().nextMaintenance?.toDate().toISOString().split("T")[0] || null,
            purchaseDate: doc.data().purchaseDate?.toDate().toISOString().split("T")[0] || null,
          }) as Machine,
      )
    } catch (error) {
      console.error(`Error al obtener máquinas con mantenimiento próximo:`, error)
      throw new Error(`No se pudieron obtener las máquinas con mantenimiento próximo`)
    }
  },

  /**
   * Obtiene todas las piezas de una máquina
   */
  async getMachineParts(machineId: string): Promise<MachinePart[]> {
    try {
      const partsRef = collection(db, "machine_parts")
      const q = query(partsRef, where("machineId", "==", machineId))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            installationDate: doc.data().installationDate?.toDate().toISOString().split("T")[0] || null,
          }) as unknown as MachinePart,
      )
    } catch (error) {
      console.error(`Error al obtener piezas para la máquina ${machineId}:`, error)
      throw new Error(`No se pudieron obtener las piezas para la máquina ${machineId}`)
    }
  },

  /**
   * Añade una pieza a una máquina
   */
  async addMachinePart(part: Omit<MachinePart, "id">): Promise<MachinePart> {
    try {
      const partsRef = collection(db, "machine_parts")

      const partToCreate = {
        ...part,
        installationDate: part.installationDate
          ? Timestamp.fromDate(new Date(part.installationDate))
          : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(partsRef, partToCreate)
      const newPart = await getDoc(docRef)

      if (!newPart.exists()) {
        throw new Error("Error al añadir la pieza")
      }

      const data = newPart.data()
      return {
        id: newPart.id,
        ...data,
        installationDate: data.installationDate?.toDate().toISOString().split("T")[0] || null,
      } as unknown as MachinePart
    } catch (error) {
      console.error("Error al añadir pieza:", error)
      throw new Error("No se pudo añadir la pieza")
    }
  },

  /**
   * Actualiza una pieza de máquina
   */
  async updateMachinePart(id: string, part: Partial<MachinePart>): Promise<MachinePart> {
    try {
      const partRef = doc(db, "machine_parts", id)
      const snapshot = await getDoc(partRef)

      if (!snapshot.exists()) {
        throw new Error("Pieza no encontrada")
      }

      const updateData = {
        ...part,
        installationDate: part.installationDate ? Timestamp.fromDate(new Date(part.installationDate)) : undefined,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(partRef, updateData)

      // Obtener la pieza actualizada
      const updatedSnapshot = await getDoc(partRef)
      const data = updatedSnapshot.data()

      return {
        id: updatedSnapshot.id,
        ...data,
        installationDate: data.installationDate?.toDate().toISOString().split("T")[0] || null,
      } as unknown as MachinePart
    } catch (error) {
      console.error(`Error al actualizar pieza con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar la pieza con ID ${id}`)
    }
  },

  /**
   * Elimina una pieza de máquina
   */
  async deleteMachinePart(id: string): Promise<void> {
    try {
      const partRef = doc(db, "machine_parts", id)
      await deleteDoc(partRef)
    } catch (error) {
      console.error(`Error al eliminar pieza con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar la pieza con ID ${id}`)
    }
  },

  /**
   * Actualiza el uso de una pieza
   */
  async updatePartUsage(
    id: string,
    additionalUsage: number,
  ): Promise<{
    newStatus: string
    statusChanged: boolean
    usagePercentage: string
  }> {
    try {
      const partRef = doc(db, "machine_parts", id)
      const snapshot = await getDoc(partRef)

      if (!snapshot.exists()) {
        throw new Error("Pieza no encontrada")
      }

      const part = snapshot.data() as unknown as MachinePart
      const currentUsage = part.currentUsage || 0
      const newUsage = currentUsage + additionalUsage

      // Actualizar el estado de la pieza
      let statusChanged = false
      let newStatus = part.status

      const usagePercentage = (newUsage / part.maxUsage) * 100

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

      await updateDoc(partRef, {
        currentUsage: newUsage,
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      // Crear notificación si el estado cambió a Crítico o Advertencia
      if (statusChanged && (newStatus === "Crítico" || newStatus === "Advertencia")) {
        // Obtener información de la máquina y la pieza para la notificación
        const machineRef = doc(db, "machines", part.machineId.toString())
        const machineSnapshot = await getDoc(machineRef)

        if (machineSnapshot.exists()) {
          const machine = machineSnapshot.data() as Machine

          await notificationService.create({
            type: "wear_part_alert",
            title: newStatus === "Crítico" ? "Reemplazo de pieza requerido" : "Alerta de desgaste de pieza",
            message:
              newStatus === "Crítico"
                ? `La pieza ${part.name} de la máquina ${machine.name} ha alcanzado el 100% de su vida útil. Se requiere reemplazo inmediato.`
                : `La pieza ${part.name} de la máquina ${machine.name} ha alcanzado el ${usagePercentage.toFixed(1)}% de su vida útil. Considere programar un reemplazo pronto.`,
            severity: newStatus === "Crítico" ? "high" : "medium",
            relatedId: id,
            read: false,
          })
        }
      }

      return {
        newStatus,
        statusChanged,
        usagePercentage: usagePercentage.toFixed(1),
      }
    } catch (error) {
      console.error(`Error al actualizar uso de pieza con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar el uso de la pieza con ID ${id}`)
    }
  },

  /**
   * Reemplaza una pieza de máquina
   */
  async replaceMachinePart(partId: string, newInventoryItemId: string): Promise<void> {
    try {
      const partRef = doc(db, "machine_parts", partId)
      const snapshot = await getDoc(partRef)

      if (!snapshot.exists()) {
        throw new Error("Pieza no encontrada")
      }

      const part = snapshot.data() as unknown as MachinePart

      // Crear una nueva pieza con la información del repuesto
      const newPart = {
        machineId: part.machineId,
        inventoryItemId: newInventoryItemId,
        name: part.name,
        installationDate: Timestamp.fromDate(new Date()),
        usageType: part.usageType,
        maxUsage: part.maxUsage,
        currentUsage: 0,
        status: "Normal",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const partsRef = collection(db, "machine_parts")
      await addDoc(partsRef, newPart)

      // Eliminar la pieza anterior
      await deleteDoc(partRef)

      // Crear notificación de reemplazo
      const machineRef = doc(db, "machines", part.machineId.toString())
      const machineSnapshot = await getDoc(machineRef)

      if (machineSnapshot.exists()) {
        const machine = machineSnapshot.data() as Machine

        await notificationService.create({
          type: "part_replacement",
          title: "Pieza reemplazada",
          message: `La pieza ${part.name} de la máquina ${machine.name} ha sido reemplazada.`,
          severity: "low",
          relatedId: part.machineId.toString(),
          read: false,
        })
      }
    } catch (error) {
      console.error(`Error al reemplazar pieza con ID ${partId}:`, error)
      throw new Error(`No se pudo reemplazar la pieza con ID ${partId}`)
    }
  },

  /**
   * Obtiene el estado de las piezas críticas
   */
  async getEstadoPiezasCriticas(): Promise<
    {
      machineId: string
      machineName: string
      partId: string
      partName: string
      usagePercentage: number
      status: string
    }[]
  > {
    try {
      const partsRef = collection(db, "machine_parts")
      const q = query(partsRef, where("status", "in", ["Advertencia", "Crítico"]))
      const snapshot = await getDocs(q)

      const results = []

      for (const doc of snapshot.docs) {
        const part = doc.data() as unknown as MachinePart

        // Obtener información de la máquina
        const machineRef = doc.ref.collection("machines").doc(part.machineId.toString())
        const machineSnapshot = await getDoc(machineRef)

        if (machineSnapshot.exists()) {
          const machine = machineSnapshot.data() as Machine

          results.push({
            machineId: part.machineId.toString(),
            machineName: machine.name,
            partId: doc.id,
            partName: part.name,
            usagePercentage: (part.currentUsage / part.maxUsage) * 100,
            status: part.status,
          })
        }
      }

      return results
    } catch (error) {
      console.error("Error al obtener estado de piezas críticas:", error)
      throw new Error("No se pudo obtener el estado de las piezas críticas")
    }
  },
}
