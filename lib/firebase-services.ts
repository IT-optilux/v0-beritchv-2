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

// Función para inicializar la base de datos con datos de ejemplo
export async function initializeFirestoreData() {
  // Verificar si ya hay datos
  const machinesSnapshot = await getDocs(collection(firestore, "machines"))
  if (!machinesSnapshot.empty) {
    console.log("La base de datos ya está inicializada")
    return
  }

  console.log("Inicializando base de datos con datos de ejemplo...")

  // Crear máquinas de ejemplo
  const machines = [
    {
      name: "Biseladora Automática",
      model: "OptiEdge 5000",
      serialNumber: "BE5000-123456",
      manufacturer: "OptiTech",
      status: "Operativa",
      location: "Área de Producción 1",
      purchaseDate: "2022-01-15",
      lastMaintenance: "2023-03-10",
      nextMaintenance: "2023-06-10",
      description: "Biseladora automática para lentes oftálmicos",
    },
    {
      name: "Bloqueadora Digital",
      model: "BlockMaster 3000",
      serialNumber: "BM3000-789012",
      manufacturer: "LensEquip",
      status: "Operativa",
      location: "Área de Producción 1",
      purchaseDate: "2022-02-20",
      lastMaintenance: "2023-02-15",
      nextMaintenance: "2023-05-15",
      description: "Bloqueadora digital para preparación de lentes",
    },
    {
      name: "Trazadora Computarizada",
      model: "TracerPro X1",
      serialNumber: "TPX1-345678",
      manufacturer: "OptiScan",
      status: "Mantenimiento",
      location: "Área de Trazado",
      purchaseDate: "2021-11-05",
      lastMaintenance: "2023-04-01",
      nextMaintenance: "2023-07-01",
      description: "Trazadora computarizada para marcos de lentes",
    },
    {
      name: "Horno de Templado",
      model: "TempMaster 2500",
      serialNumber: "TM2500-901234",
      manufacturer: "GlassTech",
      status: "Operativa",
      location: "Área de Tratamientos",
      purchaseDate: "2022-03-10",
      lastMaintenance: "2023-03-25",
      nextMaintenance: "2023-06-25",
      description: "Horno para templado de lentes",
    },
    {
      name: "Pulidora Automática",
      model: "PolishPro 1000",
      serialNumber: "PP1000-567890",
      manufacturer: "OptiPolish",
      status: "Operativa",
      location: "Área de Pulido",
      purchaseDate: "2022-04-05",
      lastMaintenance: "2023-04-10",
      nextMaintenance: "2023-07-10",
      description: "Pulidora automática para acabado de lentes",
    },
  ]

  // Crear ítems de inventario de ejemplo
  const inventoryItems = [
    {
      name: "Moldes CR-39",
      category: "Moldes",
      quantity: 150,
      minQuantity: 50,
      location: "Almacén A",
      lastUpdated: "2023-04-01",
      status: "En stock",
      description: "Moldes para lentes CR-39 estándar",
      unitPrice: 15.5,
      supplier: "OptiSupplies Inc.",
      tipo_de_item: "consumible",
    },
    {
      name: "Moldes Policarbonato",
      category: "Moldes",
      quantity: 80,
      minQuantity: 30,
      location: "Almacén A",
      lastUpdated: "2023-04-02",
      status: "En stock",
      description: "Moldes para lentes de policarbonato",
      unitPrice: 22.75,
      supplier: "PolyVision Ltd.",
      tipo_de_item: "consumible",
    },
    {
      name: "Bloques de Aleación",
      category: "Bloques",
      quantity: 25,
      minQuantity: 20,
      location: "Almacén B",
      lastUpdated: "2023-04-03",
      status: "Bajo stock",
      description: "Bloques de aleación para fijación",
      unitPrice: 8.25,
      supplier: "MetalOptics Co.",
      tipo_de_item: "consumible",
    },
    {
      name: "Cinta Adhesiva",
      category: "Consumibles",
      quantity: 45,
      minQuantity: 15,
      location: "Almacén C",
      lastUpdated: "2023-04-05",
      status: "En stock",
      description: "Cinta adhesiva especial para laboratorio",
      unitPrice: 5.99,
      supplier: "AdhesivePro",
      tipo_de_item: "consumible",
    },
    {
      name: "Líquido Pulidor",
      category: "Químicos",
      quantity: 10,
      minQuantity: 15,
      location: "Almacén D",
      lastUpdated: "2023-04-06",
      status: "Bajo stock",
      description: "Líquido para pulido de lentes",
      unitPrice: 32.5,
      supplier: "ChemLens Solutions",
      tipo_de_item: "consumible",
    },
    {
      name: "Repuestos Biseladora",
      category: "Repuestos",
      quantity: 0,
      minQuantity: 5,
      location: "Almacén B",
      lastUpdated: "2023-04-07",
      status: "Sin stock",
      description: "Kit de repuestos para biseladora",
      unitPrice: 120.0,
      supplier: "OptiTech",
      tipo_de_item: "repuesto general",
    },
    {
      name: "Disco de Corte",
      category: "Repuestos",
      quantity: 5,
      minQuantity: 3,
      location: "Almacén B",
      lastUpdated: "2023-04-08",
      status: "En stock",
      description: "Disco de corte para biseladora",
      unitPrice: 85.0,
      supplier: "OptiTech",
      tipo_de_item: "pieza de desgaste",
      unidad_de_uso: "Cortes",
      vida_util_maxima: 25000,
      lifespanUnit: "Cortes",
      lifespan: 25000,
    },
  ]

  // Crear mantenimientos de ejemplo
  const maintenances = [
    {
      machineId: 1,
      machineName: "Biseladora Automática",
      maintenanceType: "Preventivo",
      description: "Mantenimiento preventivo programado",
      startDate: "2023-04-15",
      endDate: "2023-04-15",
      status: "Completado",
      technician: "Carlos Técnico",
      cost: 250.0,
      observations: "Se realizó limpieza general y ajuste de parámetros",
    },
    {
      machineId: 2,
      machineName: "Bloqueadora Digital",
      maintenanceType: "Correctivo",
      description: "Reparación de sistema de bloqueo",
      startDate: "2023-04-10",
      status: "En proceso",
      technician: "Luis Mantenimiento",
    },
    {
      machineId: 3,
      machineName: "Trazadora Computarizada",
      maintenanceType: "Calibración",
      description: "Calibración de sensores",
      startDate: "2023-04-20",
      status: "Programado",
      technician: "Ana Técnico",
    },
  ]

  // Crear reportes de ejemplo
  const reports = [
    {
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
  ]

  // Crear registros de uso de ejemplo
  const usageLogs = [
    {
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
  ]

  // Crear notificaciones de ejemplo
  const notifications = [
    {
      type: "maintenance_alert",
      title: "Mantenimiento programado",
      message: "Mantenimiento programado para Trazadora Computarizada en 2 días",
      severity: "medium",
      relatedId: "3",
      read: false,
    },
    {
      type: "inventory_alert",
      title: "Stock bajo",
      message: "El ítem Bloques de Aleación está por debajo del nivel mínimo",
      severity: "high",
      relatedId: "3",
      read: false,
    },
    {
      type: "report_alert",
      title: "Nuevo reporte de falla",
      message: "Se ha reportado una falla en Trazadora Computarizada",
      severity: "high",
      relatedId: "1",
      read: true,
    },
  ]

  // Guardar datos en Firestore
  for (const machine of machines) {
    await machineService.create(machine)
  }

  for (const item of inventoryItems) {
    await inventoryService.create(item)
  }

  for (const maintenance of maintenances) {
    await maintenanceService.create(maintenance)
  }

  for (const report of reports) {
    await reportService.create(report)
  }

  for (const log of usageLogs) {
    await usageLogService.create(log)
  }

  for (const notification of notifications) {
    await notificationService.create(notification)
  }

  console.log("Base de datos inicializada con éxito")
}
