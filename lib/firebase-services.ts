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
  type DocumentData,
  type QueryDocumentSnapshot,
  setDoc,
  limit,
} from "firebase/firestore"
import { firestore } from "./firebase-client"
import type { Machine, InventoryItem, Maintenance, Report, UsageLog, Notification } from "@/types"

// Convertidores para manejar fechas y timestamps
const machineConverter = {
  toFirestore: (machine: Machine): DocumentData => {
    return {
      ...machine,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMaintenance: machine.lastMaintenance ? Timestamp.fromDate(new Date(machine.lastMaintenance)) : null,
      nextMaintenance: machine.nextMaintenance ? Timestamp.fromDate(new Date(machine.nextMaintenance)) : null,
      purchaseDate: machine.purchaseDate ? Timestamp.fromDate(new Date(machine.purchaseDate)) : null,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Machine => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      lastMaintenance: data.lastMaintenance?.toDate().toISOString().split("T")[0] || null,
      nextMaintenance: data.nextMaintenance?.toDate().toISOString().split("T")[0] || null,
      purchaseDate: data.purchaseDate?.toDate().toISOString().split("T")[0] || null,
    } as Machine
  },
}

const inventoryItemConverter = {
  toFirestore: (item: InventoryItem): DocumentData => {
    return {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastUpdated: Timestamp.fromDate(new Date(item.lastUpdated || new Date())),
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): InventoryItem => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      lastUpdated: data.lastUpdated?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
    } as InventoryItem
  },
}

const maintenanceConverter = {
  toFirestore: (maintenance: Maintenance): DocumentData => {
    return {
      ...maintenance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startDate: maintenance.startDate ? Timestamp.fromDate(new Date(maintenance.startDate)) : null,
      endDate: maintenance.endDate ? Timestamp.fromDate(new Date(maintenance.endDate)) : null,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Maintenance => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      startDate: data.startDate?.toDate().toISOString().split("T")[0] || null,
      endDate: data.endDate?.toDate().toISOString().split("T")[0] || null,
    } as Maintenance
  },
}

const reportConverter = {
  toFirestore: (report: Report): DocumentData => {
    return {
      ...report,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reportDate: report.reportDate ? Timestamp.fromDate(new Date(report.reportDate)) : null,
      completedDate: report.completedDate ? Timestamp.fromDate(new Date(report.completedDate)) : null,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Report => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      reportDate: data.reportDate?.toDate().toISOString().split("T")[0] || null,
      completedDate: data.completedDate?.toDate().toISOString().split("T")[0] || null,
    } as Report
  },
}

const usageLogConverter = {
  toFirestore: (log: UsageLog): DocumentData => {
    return {
      ...log,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      fecha: log.fecha ? Timestamp.fromDate(new Date(log.fecha)) : null,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): UsageLog => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      fecha: data.fecha?.toDate().toISOString().split("T")[0] || null,
      created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    } as UsageLog
  },
}

const notificationConverter = {
  toFirestore: (notification: Notification): DocumentData => {
    return {
      ...notification,
      createdAt: serverTimestamp(),
      read: false,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Notification => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    } as Notification
  },
}

// Servicios para Máquinas
export const machineService = {
  async getAll(): Promise<Machine[]> {
    const machinesRef = collection(firestore, "machines").withConverter(machineConverter)
    const snapshot = await getDocs(machinesRef)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<Machine | null> {
    const machineRef = doc(firestore, "machines", id).withConverter(machineConverter)
    const snapshot = await getDoc(machineRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(machine: Omit<Machine, "id">): Promise<Machine> {
    const machinesRef = collection(firestore, "machines").withConverter(machineConverter)
    const docRef = await addDoc(machinesRef, machine as Machine)
    const newMachine = await getDoc(docRef)
    return newMachine.data() as Machine
  },

  async update(id: string, machine: Partial<Machine>): Promise<void> {
    const machineRef = doc(firestore, "machines", id)
    const updateData = {
      ...machine,
      updatedAt: serverTimestamp(),
      lastMaintenance: machine.lastMaintenance ? Timestamp.fromDate(new Date(machine.lastMaintenance)) : undefined,
      nextMaintenance: machine.nextMaintenance ? Timestamp.fromDate(new Date(machine.nextMaintenance)) : undefined,
      purchaseDate: machine.purchaseDate ? Timestamp.fromDate(new Date(machine.purchaseDate)) : undefined,
    }
    await updateDoc(machineRef, updateData)
  },

  async delete(id: string): Promise<void> {
    const machineRef = doc(firestore, "machines", id)
    await deleteDoc(machineRef)
  },

  async getByStatus(status: string): Promise<Machine[]> {
    const machinesRef = collection(firestore, "machines").withConverter(machineConverter)
    const q = query(machinesRef, where("status", "==", status))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getUpcomingMaintenance(days = 7): Promise<Machine[]> {
    const machinesRef = collection(firestore, "machines").withConverter(machineConverter)
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
    return snapshot.docs.map((doc) => doc.data())
  },
}

// Servicios para Inventario
export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const itemsRef = collection(firestore, "inventory").withConverter(inventoryItemConverter)
    const snapshot = await getDocs(itemsRef)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<InventoryItem | null> {
    const itemRef = doc(firestore, "inventory", id).withConverter(inventoryItemConverter)
    const snapshot = await getDoc(itemRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(item: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    const itemsRef = collection(firestore, "inventory").withConverter(inventoryItemConverter)
    const docRef = await addDoc(itemsRef, item as InventoryItem)
    const newItem = await getDoc(docRef)
    return newItem.data() as InventoryItem
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<void> {
    const itemRef = doc(firestore, "inventory", id)
    const updateData = {
      ...item,
      updatedAt: serverTimestamp(),
      lastUpdated: item.lastUpdated ? Timestamp.fromDate(new Date(item.lastUpdated)) : serverTimestamp(),
    }
    await updateDoc(itemRef, updateData)
  },

  async delete(id: string): Promise<void> {
    const itemRef = doc(firestore, "inventory", id)
    await deleteDoc(itemRef)
  },

  async getByStatus(status: string): Promise<InventoryItem[]> {
    const itemsRef = collection(firestore, "inventory").withConverter(inventoryItemConverter)
    const q = query(itemsRef, where("status", "==", status))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getByCategory(category: string): Promise<InventoryItem[]> {
    const itemsRef = collection(firestore, "inventory").withConverter(inventoryItemConverter)
    const q = query(itemsRef, where("category", "==", category))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const itemsRef = collection(firestore, "inventory").withConverter(inventoryItemConverter)
    const snapshot = await getDocs(itemsRef)
    return snapshot.docs.map((doc) => doc.data()).filter((item) => item.quantity <= item.minQuantity)
  },

  async adjustQuantity(id: string, adjustment: number): Promise<void> {
    const itemRef = doc(firestore, "inventory", id)
    const snapshot = await getDoc(itemRef)

    if (!snapshot.exists()) {
      throw new Error("Item not found")
    }

    const currentItem = snapshot.data() as InventoryItem
    const newQuantity = Math.max(0, currentItem.quantity + adjustment)
    const status = newQuantity === 0 ? "Sin stock" : newQuantity < currentItem.minQuantity ? "Bajo stock" : "En stock"

    await updateDoc(itemRef, {
      quantity: newQuantity,
      status,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },
}

// Servicios para Mantenimientos
export const maintenanceService = {
  async getAll(): Promise<Maintenance[]> {
    const maintenanceRef = collection(firestore, "maintenance").withConverter(maintenanceConverter)
    const snapshot = await getDocs(maintenanceRef)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<Maintenance | null> {
    const maintenanceRef = doc(firestore, "maintenance", id).withConverter(maintenanceConverter)
    const snapshot = await getDoc(maintenanceRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(maintenance: Omit<Maintenance, "id">): Promise<Maintenance> {
    const maintenanceRef = collection(firestore, "maintenance").withConverter(maintenanceConverter)
    const docRef = await addDoc(maintenanceRef, maintenance as Maintenance)
    const newMaintenance = await getDoc(docRef)
    return newMaintenance.data() as Maintenance
  },

  async update(id: string, maintenance: Partial<Maintenance>): Promise<void> {
    const maintenanceRef = doc(firestore, "maintenance", id)
    const updateData = {
      ...maintenance,
      updatedAt: serverTimestamp(),
      startDate: maintenance.startDate ? Timestamp.fromDate(new Date(maintenance.startDate)) : undefined,
      endDate: maintenance.endDate ? Timestamp.fromDate(new Date(maintenance.endDate)) : undefined,
    }
    await updateDoc(maintenanceRef, updateData)
  },

  async delete(id: string): Promise<void> {
    const maintenanceRef = doc(firestore, "maintenance", id)
    await deleteDoc(maintenanceRef)
  },

  async getByMachineId(machineId: number): Promise<Maintenance[]> {
    const maintenanceRef = collection(firestore, "maintenance").withConverter(maintenanceConverter)
    const q = query(maintenanceRef, where("machineId", "==", machineId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getByStatus(status: string): Promise<Maintenance[]> {
    const maintenanceRef = collection(firestore, "maintenance").withConverter(maintenanceConverter)
    const q = query(maintenanceRef, where("status", "==", status))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getUpcoming(days = 7): Promise<Maintenance[]> {
    const maintenanceRef = collection(firestore, "maintenance").withConverter(maintenanceConverter)
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
    return snapshot.docs.map((doc) => doc.data())
  },
}

// Servicios para Reportes
export const reportService = {
  async getAll(): Promise<Report[]> {
    const reportsRef = collection(firestore, "reports").withConverter(reportConverter)
    const snapshot = await getDocs(reportsRef)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<Report | null> {
    const reportRef = doc(firestore, "reports", id).withConverter(reportConverter)
    const snapshot = await getDoc(reportRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(report: Omit<Report, "id">): Promise<Report> {
    const reportsRef = collection(firestore, "reports").withConverter(reportConverter)
    const docRef = await addDoc(reportsRef, report as Report)
    const newReport = await getDoc(docRef)
    return newReport.data() as Report
  },

  async update(id: string, report: Partial<Report>): Promise<void> {
    const reportRef = doc(firestore, "reports", id)
    const updateData = {
      ...report,
      updatedAt: serverTimestamp(),
      reportDate: report.reportDate ? Timestamp.fromDate(new Date(report.reportDate)) : undefined,
      completedDate: report.completedDate ? Timestamp.fromDate(new Date(report.completedDate)) : undefined,
    }
    await updateDoc(reportRef, updateData)
  },

  async delete(id: string): Promise<void> {
    const reportRef = doc(firestore, "reports", id)
    await deleteDoc(reportRef)
  },

  async getByMachineId(machineId: number): Promise<Report[]> {
    const reportsRef = collection(firestore, "reports").withConverter(reportConverter)
    const q = query(reportsRef, where("machineId", "==", machineId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getByStatus(status: string): Promise<Report[]> {
    const reportsRef = collection(firestore, "reports").withConverter(reportConverter)
    const q = query(reportsRef, where("status", "==", status))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getRecent(limit = 5): Promise<Report[]> {
    const reportsRef = collection(firestore, "reports").withConverter(reportConverter)
    const q = query(reportsRef, orderBy("createdAt", "desc"), limit(limit))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },
}

// Servicios para Registros de Uso
export const usageLogService = {
  async getAll(): Promise<UsageLog[]> {
    const logsRef = collection(firestore, "usageLogs").withConverter(usageLogConverter)
    const snapshot = await getDocs(logsRef)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<UsageLog | null> {
    const logRef = doc(firestore, "usageLogs", id).withConverter(usageLogConverter)
    const snapshot = await getDoc(logRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(log: Omit<UsageLog, "id">): Promise<UsageLog> {
    const logsRef = collection(firestore, "usageLogs").withConverter(usageLogConverter)
    const docRef = await addDoc(logsRef, log as UsageLog)
    const newLog = await getDoc(docRef)
    return newLog.data() as UsageLog
  },

  async update(id: string, log: Partial<UsageLog>): Promise<void> {
    const logRef = doc(firestore, "usageLogs", id)
    const updateData = {
      ...log,
      updatedAt: serverTimestamp(),
      fecha: log.fecha ? Timestamp.fromDate(new Date(log.fecha)) : undefined,
    }
    await updateDoc(logRef, updateData)
  },

  async delete(id: string): Promise<void> {
    const logRef = doc(firestore, "usageLogs", id)
    await deleteDoc(logRef)
  },

  async getByEquipoId(equipoId: number): Promise<UsageLog[]> {
    const logsRef = collection(firestore, "usageLogs").withConverter(usageLogConverter)
    const q = query(logsRef, where("equipo_id", "==", equipoId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getByInventoryItemId(itemId: number): Promise<UsageLog[]> {
    const logsRef = collection(firestore, "usageLogs").withConverter(usageLogConverter)
    const q = query(logsRef, where("item_inventario_id", "==", itemId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async calcularUsoAcumulado(equipoId: number, itemId: number): Promise<number> {
    const logsRef = collection(firestore, "usageLogs").withConverter(usageLogConverter)
    const q = query(logsRef, where("equipo_id", "==", equipoId), where("item_inventario_id", "==", itemId))
    const snapshot = await getDocs(q)
    const logs = snapshot.docs.map((doc) => doc.data())
    return logs.reduce((total, log) => total + log.cantidad_usada, 0)
  },

  async registrarMantenimiento(equipoId: number, itemId: number, data: any): Promise<void> {
    // Obtener uso acumulado actual
    const usoAcumulado = await this.calcularUsoAcumulado(equipoId, itemId)

    // Crear un registro de uso con cantidad negativa para "reiniciar" el contador
    await this.create({
      equipo_id: equipoId,
      equipo_nombre: data.equipo_nombre,
      item_inventario_id: itemId,
      item_inventario_nombre: data.item_inventario_nombre,
      fecha: data.fecha,
      cantidad_usada: -usoAcumulado,
      unidad_de_uso: data.unidad_de_uso,
      responsable: data.responsable,
      comentarios: `Mantenimiento realizado: ${data.comentarios}`,
      created_at: new Date().toISOString(),
    })

    // Crear notificación de mantenimiento
    await notificationService.create({
      type: "maintenance",
      title: "Mantenimiento registrado",
      message: `Se ha registrado un mantenimiento para ${data.item_inventario_nombre} en ${data.equipo_nombre} por ${data.responsable}.`,
      severity: "low",
      relatedId: `${equipoId}_${itemId}`,
      read: false,
    })
  },
}

// Servicios para Notificaciones
export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const notificationsRef = collection(firestore, "notifications").withConverter(notificationConverter)
    const q = query(notificationsRef, orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getById(id: string): Promise<Notification | null> {
    const notificationRef = doc(firestore, "notifications", id).withConverter(notificationConverter)
    const snapshot = await getDoc(notificationRef)
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(notification: Omit<Notification, "id">): Promise<Notification> {
    const notificationsRef = collection(firestore, "notifications").withConverter(notificationConverter)
    const docRef = await addDoc(notificationsRef, notification as Notification)
    const newNotification = await getDoc(docRef)
    return newNotification.data() as Notification
  },

  async markAsRead(id: string): Promise<void> {
    const notificationRef = doc(firestore, "notifications", id)
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: serverTimestamp(),
    })
  },

  async markAllAsRead(): Promise<void> {
    const notificationsRef = collection(firestore, "notifications")
    const q = query(notificationsRef, where("read", "==", false))
    const snapshot = await getDocs(q)

    const batch = firestore.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
  },

  async delete(id: string): Promise<void> {
    const notificationRef = doc(firestore, "notifications", id)
    await deleteDoc(notificationRef)
  },

  async getUnread(): Promise<Notification[]> {
    const notificationsRef = collection(firestore, "notifications").withConverter(notificationConverter)
    const q = query(notificationsRef, where("read", "==", false), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },

  async getByType(type: string): Promise<Notification[]> {
    const notificationsRef = collection(firestore, "notifications").withConverter(notificationConverter)
    const q = query(notificationsRef, where("type", "==", type), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  },
}

// Datos de ejemplo para inicializar Firestore
const sampleData = {
  inventory: [
    { id: "inv1", name: "Lente CR-39", category: "Lentes", quantity: 100, minStock: 20, unit: "unidades" },
    { id: "inv2", name: "Lente Policarbonato", category: "Lentes", quantity: 75, minStock: 15, unit: "unidades" },
    { id: "inv3", name: "Montura Acetato", category: "Monturas", quantity: 50, minStock: 10, unit: "unidades" },
  ],
  machines: [
    {
      id: "mach1",
      name: "Biseladora Automática",
      model: "BA-2000",
      status: "Operativa",
      lastMaintenance: new Date().toISOString(),
    },
    {
      id: "mach2",
      name: "Frontofocómetro Digital",
      model: "FD-500",
      status: "Operativa",
      lastMaintenance: new Date().toISOString(),
    },
  ],
  maintenance: [
    {
      id: "maint1",
      machineId: "mach1",
      type: "Preventivo",
      status: "Completado",
      date: new Date().toISOString(),
      technician: "Juan Pérez",
      notes: "Mantenimiento de rutina",
    },
  ],
  usageLogs: [
    {
      id: "log1",
      machineId: "mach1",
      operatorId: "user1",
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date().toISOString(),
      notes: "Operación normal",
    },
  ],
  users: [
    {
      id: "user1",
      email: "admin@example.com",
      name: "Administrador",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "user2",
      email: "tecnico@example.com",
      name: "Técnico",
      role: "technician",
      createdAt: new Date().toISOString(),
    },
  ],
}

// Función para inicializar datos en Firestore
export async function initializeFirestoreData() {
  try {
    if (!firestore) {
      console.error("Firestore no está inicializado")
      return
    }

    console.log("Inicializando datos en Firestore...")

    // Verificar si ya hay datos en Firestore
    const inventoryQuery = query(collection(firestore, "inventory"), limit(1))
    const inventorySnapshot = await getDocs(inventoryQuery)

    if (!inventorySnapshot.empty) {
      console.log("Firestore ya contiene datos, omitiendo inicialización")
      return
    }

    // Inicializar datos de ejemplo
    for (const collectionName in sampleData) {
      const collectionRef = collection(firestore, collectionName)

      for (const item of sampleData[collectionName]) {
        await setDoc(doc(collectionRef, item.id), item)
      }

      console.log(`Colección ${collectionName} inicializada`)
    }

    console.log("Inicialización de datos completada")
  } catch (error) {
    console.error("Error al inicializar datos en Firestore:", error)
    throw error
  }
}
