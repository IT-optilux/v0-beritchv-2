// Este archivo define la estructura de datos para Firestore

// Colección: users
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "technician"
  createdAt: Date
  updatedAt: Date
}

// Colección: inventory
export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minQuantity: number
  location?: string
  status: "En stock" | "Bajo stock" | "Agotado"
  description?: string
  unitPrice?: number
  supplier?: string
  tipo_de_item: "consumible" | "repuesto"
  unidad_de_uso?: string
  vida_util_maxima?: number
  lifespanUnit?: string
  lifespan?: number
  createdAt: Date
  updatedAt: Date
  lastUpdated: Date
}

// Colección: machines
export interface Machine {
  id: string
  name: string
  model: string
  serialNumber?: string
  manufacturer?: string
  purchaseDate?: Date
  location?: string
  status: "Operativa" | "En mantenimiento" | "Fuera de servicio"
  description?: string
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Subcolección: machines/{machineId}/parts
export interface MachinePart {
  id: string
  inventoryItemId?: string // Referencia a un item de inventario
  name: string
  partNumber?: string
  currentUsage: number
  maxUsage?: number
  usageUnit?: string
  installationDate?: Date
  lastReplacementDate?: Date
  status: "Operativa" | "Requiere reemplazo" | "Reemplazada"
  createdAt: Date
  updatedAt: Date
}

// Colección: usageLogs
export interface UsageLog {
  id: string
  machineId: string // Referencia a una máquina
  userId?: string // Referencia a un usuario
  usageAmount: number
  usageDate: Date
  notes?: string
  createdAt: Date
}

// Colección: maintenance
export interface Maintenance {
  id: string
  machineId: string // Referencia a una máquina
  userId?: string // Referencia a un usuario
  maintenanceType: "Preventivo" | "Correctivo" | "Predictivo"
  scheduledDate?: Date
  completionDate?: Date
  status: "Pendiente" | "En progreso" | "Completado" | "Cancelado"
  description?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  parts?: MaintenancePart[] // Partes utilizadas en el mantenimiento
}

// Tipo para partes utilizadas en mantenimiento
export interface MaintenancePart {
  inventoryItemId?: string // Referencia a un item de inventario
  quantity: number
}

// Colección: reports
export interface Report {
  id: string
  title: string
  reportType: string
  userId?: string // Referencia a un usuario
  dateRangeStart?: Date
  dateRangeEnd?: Date
  content: any // Contenido del reporte en formato JSON
  createdAt: Date
}

// Colección: notifications
export interface Notification {
  id: string
  userId: string // Referencia a un usuario
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  isRead: boolean
  relatedEntityType?: string
  relatedEntityId?: string
  createdAt: Date
}

// Colección: history
export interface HistoryEntry {
  id: string
  entityType: string
  entityId: string
  action: "create" | "update" | "delete"
  userId?: string // Referencia a un usuario
  details?: any // Detalles de la acción en formato JSON
  createdAt: Date
}
