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
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import type { Report } from "@/types"
import { notificationService } from "./notification-service"

export const reportService = {
  /**
   * Obtiene todos los reportes
   */
  async getAll(): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error("Error al obtener reportes:", error)
      throw new Error("No se pudieron obtener los reportes")
    }
  },

  /**
   * Obtiene un reporte por su ID
   */
  async getById(id: string): Promise<Report | null> {
    try {
      const reportRef = doc(db, "reports", id)
      const snapshot = await getDoc(reportRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        id: snapshot.id,
        ...data,
        reportDate: data.reportDate?.toDate().toISOString().split("T")[0] || null,
        completedDate: data.completedDate?.toDate().toISOString().split("T")[0] || null,
      } as Report
    } catch (error) {
      console.error(`Error al obtener reporte con ID ${id}:`, error)
      throw new Error(`No se pudo obtener el reporte con ID ${id}`)
    }
  },

  /**
   * Crea un nuevo reporte
   */
  async create(report: Omit<Report, "id">): Promise<Report> {
    try {
      const reportsRef = collection(db, "reports")

      const reportToCreate = {
        ...report,
        reportDate: report.reportDate
          ? Timestamp.fromDate(new Date(report.reportDate))
          : Timestamp.fromDate(new Date()),
        completedDate: report.completedDate ? Timestamp.fromDate(new Date(report.completedDate)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(reportsRef, reportToCreate)
      const newReport = await getDoc(docRef)

      if (!newReport.exists()) {
        throw new Error("Error al crear el reporte")
      }

      const data = newReport.data()
      const createdReport = {
        id: newReport.id,
        ...data,
        reportDate: data.reportDate?.toDate().toISOString().split("T")[0] || null,
        completedDate: data.completedDate?.toDate().toISOString().split("T")[0] || null,
      } as Report

      // Crear notificación
      await notificationService.create({
        type: "report",
        title: `Nuevo reporte de ${report.reportType.toLowerCase()}`,
        message: `Se ha creado un nuevo reporte de ${report.reportType.toLowerCase()} para ${report.machineName} con prioridad ${report.priority.toLowerCase()}.`,
        severity: report.priority === "Alta" ? "high" : report.priority === "Media" ? "medium" : "low",
        relatedId: report.machineId.toString(),
        read: false,
      })

      return createdReport
    } catch (error) {
      console.error("Error al crear reporte:", error)
      throw new Error("No se pudo crear el reporte")
    }
  },

  /**
   * Actualiza un reporte existente
   */
  async update(id: string, report: Partial<Report>): Promise<Report> {
    try {
      const reportRef = doc(db, "reports", id)
      const snapshot = await getDoc(reportRef)

      if (!snapshot.exists()) {
        throw new Error("Reporte no encontrado")
      }

      const currentReport = snapshot.data() as Report

      const updateData = {
        ...report,
        reportDate: report.reportDate ? Timestamp.fromDate(new Date(report.reportDate)) : undefined,
        completedDate: report.completedDate ? Timestamp.fromDate(new Date(report.completedDate)) : undefined,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(reportRef, updateData)

      // Obtener el reporte actualizado
      const updatedSnapshot = await getDoc(reportRef)
      const data = updatedSnapshot.data()

      const updatedReport = {
        id: updatedSnapshot.id,
        ...data,
        reportDate: data.reportDate?.toDate().toISOString().split("T")[0] || null,
        completedDate: data.completedDate?.toDate().toISOString().split("T")[0] || null,
      } as Report

      // Si el estado cambió a "Completado", crear notificación
      if (report.status === "Completado" && currentReport.status !== "Completado") {
        await notificationService.create({
          type: "report_completed",
          title: "Reporte completado",
          message: `El reporte de ${currentReport.reportType.toLowerCase()} para ${currentReport.machineName} ha sido completado.`,
          severity: "low",
          relatedId: currentReport.machineId.toString(),
          read: false,
        })
      }

      // Si se asignó a alguien, crear notificación
      if (report.assignedTo && report.assignedTo !== currentReport.assignedTo) {
        await notificationService.create({
          type: "report_assigned",
          title: "Reporte asignado",
          message: `El reporte de ${currentReport.reportType.toLowerCase()} para ${currentReport.machineName} ha sido asignado a ${report.assignedTo}.`,
          severity: "medium",
          relatedId: currentReport.machineId.toString(),
          read: false,
        })
      }

      return updatedReport
    } catch (error) {
      console.error(`Error al actualizar reporte con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar el reporte con ID ${id}`)
    }
  },

  /**
   * Elimina un reporte
   */
  async delete(id: string): Promise<void> {
    try {
      const reportRef = doc(db, "reports", id)
      await deleteDoc(reportRef)
    } catch (error) {
      console.error(`Error al eliminar reporte con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar el reporte con ID ${id}`)
    }
  },

  /**
   * Obtiene reportes por máquina
   */
  async getByMachineId(machineId: string): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, where("machineId", "==", Number(machineId)), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error(`Error al obtener reportes para la máquina ${machineId}:`, error)
      throw new Error(`No se pudieron obtener los reportes para la máquina ${machineId}`)
    }
  },

  /**
   * Obtiene reportes por estado
   */
  async getByStatus(status: string): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, where("status", "==", status), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error(`Error al obtener reportes por estado ${status}:`, error)
      throw new Error(`No se pudieron obtener los reportes por estado ${status}`)
    }
  },

  /**
   * Obtiene reportes recientes
   */
  async getRecent(limitCount = 5): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, orderBy("createdAt", "desc"), limit(limitCount))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error("Error al obtener reportes recientes:", error)
      throw new Error("No se pudieron obtener los reportes recientes")
    }
  },

  /**
   * Obtiene reportes por tipo
   */
  async getByType(type: string): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, where("reportType", "==", type), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error(`Error al obtener reportes por tipo ${type}:`, error)
      throw new Error(`No se pudieron obtener los reportes por tipo ${type}`)
    }
  },

  /**
   * Obtiene reportes por prioridad
   */
  async getByPriority(priority: string): Promise<Report[]> {
    try {
      const reportsRef = collection(db, "reports")
      const q = query(reportsRef, where("priority", "==", priority), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            reportDate: doc.data().reportDate?.toDate().toISOString().split("T")[0] || null,
            completedDate: doc.data().completedDate?.toDate().toISOString().split("T")[0] || null,
          }) as Report,
      )
    } catch (error) {
      console.error(`Error al obtener reportes por prioridad ${priority}:`, error)
      throw new Error(`No se pudieron obtener los reportes por prioridad ${priority}`)
    }
  },
}
