"use server"

import { revalidatePath } from "next/cache"
import type { Report } from "@/types"

// Simulación de base de datos
let reports: Report[] = [
  {
    id: 1,
    machineId: 3,
    machineName: "Trazadora Computarizada",
    reportType: "Falla",
    description: "Error en el sistema de trazado, no reconoce patrones",
    reportedBy: "Juan Pérez",
    reportDate: "2023-04-10",
    status: "Pendiente",
    priority: "Alta",
    assignedTo: "Carlos Técnico",
  },
  {
    id: 2,
    machineId: 2,
    machineName: "Bloqueadora Digital",
    reportType: "Mantenimiento",
    description: "Mantenimiento preventivo programado",
    reportedBy: "María López",
    reportDate: "2023-04-08",
    status: "En proceso",
    priority: "Media",
    assignedTo: "Luis Mantenimiento",
  },
  {
    id: 3,
    machineId: 1,
    machineName: "Biseladora Automática",
    reportType: "Calibración",
    description: "Requiere calibración de precisión",
    reportedBy: "Carlos Rodríguez",
    reportDate: "2023-04-05",
    status: "Completado",
    priority: "Baja",
    completedDate: "2023-04-07",
    resolution: "Se realizó calibración y ajuste de parámetros",
    assignedTo: "Ana Técnico",
  },
  {
    id: 4,
    machineId: 5,
    machineName: "Pulidora Automática",
    reportType: "Falla",
    description: "Ruido anormal durante el funcionamiento",
    reportedBy: "Ana Martínez",
    reportDate: "2023-04-12",
    status: "Pendiente",
    priority: "Media",
    assignedTo: "Pedro Técnico",
  },
  {
    id: 5,
    machineId: 4,
    machineName: "Horno de Templado",
    reportType: "Falla",
    description: "Temperatura inconsistente durante el ciclo",
    reportedBy: "Pedro Sánchez",
    reportDate: "2023-04-11",
    status: "Pendiente",
    priority: "Alta",
    assignedTo: "Carlos Técnico",
  },
]

// Función de utilidad para manejar errores
const handleActionError = (error: unknown, message: string) => {
  console.error(`${message}:`, error)
  return {
    success: false,
    message: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.",
  }
}

export async function getReports() {
  return reports
}

export async function getReportById(id: number) {
  return reports.find((report) => report.id === id)
}

export async function createReport(formData: FormData) {
  try {
    const newReport: Report = {
      id: reports.length > 0 ? Math.max(...reports.map((r) => r.id)) + 1 : 1,
      machineId: Number(formData.get("machineId")),
      machineName: formData.get("machineName") as string,
      reportType: formData.get("reportType") as "Falla" | "Mantenimiento" | "Calibración",
      description: formData.get("description") as string,
      reportedBy: formData.get("reportedBy") as string,
      reportDate: formData.get("reportDate") as string,
      status: formData.get("status") as "Pendiente" | "En proceso" | "Completado",
      priority: formData.get("priority") as "Alta" | "Media" | "Baja",
      assignedTo: formData.get("assignedTo") as string,
      resolution: formData.get("resolution") as string,
      completedDate: formData.get("completedDate") as string,
    }

    reports.push(newReport)
    revalidatePath("/dashboard/reports")
    return { success: true, message: "Reporte creado exitosamente", report: newReport }
  } catch (error) {
    return handleActionError(error, "Error al crear reporte")
  }
}

export async function updateReport(formData: FormData) {
  const id = Number(formData.get("id"))
  const index = reports.findIndex((report) => report.id === id)

  if (index === -1) {
    return { success: false, message: "Reporte no encontrado" }
  }

  const updatedReport: Report = {
    id,
    machineId: Number(formData.get("machineId")),
    machineName: formData.get("machineName") as string,
    reportType: formData.get("reportType") as "Falla" | "Mantenimiento" | "Calibración",
    description: formData.get("description") as string,
    reportedBy: formData.get("reportedBy") as string,
    reportDate: formData.get("reportDate") as string,
    status: formData.get("status") as "Pendiente" | "En proceso" | "Completado",
    priority: formData.get("priority") as "Alta" | "Media" | "Baja",
    assignedTo: formData.get("assignedTo") as string,
    resolution: formData.get("resolution") as string,
    completedDate: formData.get("completedDate") as string,
  }

  reports[index] = updatedReport
  revalidatePath("/dashboard/reports")
  return { success: true, message: "Reporte actualizado exitosamente", report: updatedReport }
}

export async function deleteReport(id: number) {
  const initialLength = reports.length
  reports = reports.filter((report) => report.id !== id)

  if (reports.length === initialLength) {
    return { success: false, message: "Reporte no encontrado" }
  }

  revalidatePath("/dashboard/reports")
  return { success: true, message: "Reporte eliminado exitosamente" }
}
