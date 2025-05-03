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
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import type { Notification } from "@/types"

export const notificationService = {
  /**
   * Obtiene todas las notificaciones
   */
  async getAll(): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as Notification,
      )
    } catch (error) {
      console.error("Error al obtener notificaciones:", error)
      throw new Error("No se pudieron obtener las notificaciones")
    }
  },

  /**
   * Obtiene una notificación por su ID
   */
  async getById(id: string): Promise<Notification | null> {
    try {
      const notificationRef = doc(db, "notifications", id)
      const snapshot = await getDoc(notificationRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Notification
    } catch (error) {
      console.error(`Error al obtener notificación con ID ${id}:`, error)
      throw new Error(`No se pudo obtener la notificación con ID ${id}`)
    }
  },

  /**
   * Crea una nueva notificación
   */
  async create(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    try {
      const notificationsRef = collection(db, "notifications")

      const notificationToCreate = {
        ...notification,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(notificationsRef, notificationToCreate)
      const newNotification = await getDoc(docRef)

      if (!newNotification.exists()) {
        throw new Error("Error al crear la notificación")
      }

      const data = newNotification.data()
      return {
        id: newNotification.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Notification
    } catch (error) {
      console.error("Error al crear notificación:", error)
      throw new Error("No se pudo crear la notificación")
    }
  },

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", id)
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error(`Error al marcar notificación con ID ${id} como leída:`, error)
      throw new Error(`No se pudo marcar la notificación con ID ${id} como leída`)
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("read", "==", false))
      const snapshot = await getDocs(q)

      const batch = writeBatch(db)

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
      throw new Error("No se pudieron marcar todas las notificaciones como leídas")
    }
  },

  /**
   * Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", id)
      await deleteDoc(notificationRef)
    } catch (error) {
      console.error(`Error al eliminar notificación con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar la notificación con ID ${id}`)
    }
  },

  /**
   * Obtiene notificaciones no leídas
   */
  async getUnread(): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("read", "==", false), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as Notification,
      )
    } catch (error) {
      console.error("Error al obtener notificaciones no leídas:", error)
      throw new Error("No se pudieron obtener las notificaciones no leídas")
    }
  },

  /**
   * Obtiene notificaciones por tipo
   */
  async getByType(type: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("type", "==", type), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as Notification,
      )
    } catch (error) {
      console.error(`Error al obtener notificaciones por tipo ${type}:`, error)
      throw new Error(`No se pudieron obtener las notificaciones por tipo ${type}`)
    }
  },

  /**
   * Obtiene notificaciones por severidad
   */
  async getBySeverity(severity: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("severity", "==", severity), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as Notification,
      )
    } catch (error) {
      console.error(`Error al obtener notificaciones por severidad ${severity}:`, error)
      throw new Error(`No se pudieron obtener las notificaciones por severidad ${severity}`)
    }
  },

  /**
   * Obtiene notificaciones relacionadas con una entidad
   */
  async getByRelatedId(relatedId: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("relatedId", "==", relatedId), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
          }) as Notification,
      )
    } catch (error) {
      console.error(`Error al obtener notificaciones relacionadas con ID ${relatedId}:`, error)
      throw new Error(`No se pudieron obtener las notificaciones relacionadas con ID ${relatedId}`)
    }
  },
}
