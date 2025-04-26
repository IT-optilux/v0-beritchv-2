"use server"

import { revalidatePath } from "next/cache"
import type { Notification } from "@/types"

// Simulación de base de datos para notificaciones
let notifications: Notification[] = []

/**
 * Crea una nueva notificación
 */
export async function createNotification(notification: Omit<Notification, "id" | "createdAt" | "read">) {
  const newNotification: Notification = {
    id: `notification_${Date.now()}`,
    ...notification,
    createdAt: new Date().toISOString(),
    read: false,
  }

  notifications.unshift(newNotification)
  revalidatePath("/dashboard")
  return newNotification
}

/**
 * Obtiene todas las notificaciones
 */
export async function getNotifications() {
  return notifications
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(id: string) {
  const notification = notifications.find((n) => n.id === id)
  if (notification) {
    notification.read = true
    revalidatePath("/dashboard")
    return true
  }
  return false
}

/**
 * Elimina una notificación
 */
export async function deleteNotification(id: string) {
  const initialLength = notifications.length
  notifications = notifications.filter((n) => n.id !== id)
  revalidatePath("/dashboard")
  return notifications.length < initialLength
}

/**
 * Crea una notificación para una pieza de desgaste que está cerca de su límite
 */
export async function createWearPartAlert(
  partId: string,
  machineName: string,
  partName: string,
  usagePercentage: number,
) {
  const severity = usagePercentage >= 100 ? "high" : "medium"
  const message =
    usagePercentage >= 100
      ? `La pieza ${partName} de la máquina ${machineName} ha alcanzado el 100% de su vida útil. Se requiere reemplazo inmediato.`
      : `La pieza ${partName} de la máquina ${machineName} ha alcanzado el ${usagePercentage}% de su vida útil. Considere programar un reemplazo pronto.`

  return createNotification({
    type: "wear_part_alert",
    title: usagePercentage >= 100 ? "Reemplazo de pieza requerido" : "Alerta de desgaste de pieza",
    message,
    severity,
    relatedId: partId,
  })
}
