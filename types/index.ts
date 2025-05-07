// Tipos para Máquinas
export interface Machine {
  id: string
  name: string
  model: string
  serialNumber: string
  manufacturer?: string
  status: "Operativa" | "Mantenimiento" | "Inoperativa"
  location?: string
  purchaseDate?: string | null
  lastMaintenance?: string | null
  nextMaintenance?: string | null
  description?: string
  item_inventario_asociado?: string | null
  createdAt?: string
  updatedAt?: string
}

// Tipos para Inventario
export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minQuantity: number
  location: string
  lastUpdated: string
  status: "En stock" | "Bajo stock" | "Sin stock"
  description?: string
  unitPrice?: number
  supplier?: string
  tipo_de_item?: "consumible" | "repuesto general" | "pieza de desgaste"
  unidad_de_uso?: string
  vida_util_maxima?: number
  lifespanUnit?: string
  lifespan?: number
  createdAt?: string
  updatedAt?: string
}

// Tipos para Mantenimientos
export interface Maintenance {
  id: string
  machineId: string
  machineName: string
  maintenanceType: "Preventivo" | "Correctivo" | "Calibración"
  description: string
  startDate?: string | null
  endDate?: string | null
  status: "Programado" | "En proceso" | "Completado" | "Cancelado"
  technician: string
  cost?: number | null
  observations?: string
  createdAt?: string
  updatedAt?: string
}

// Tipos para Reportes
export interface Report {
  id: string
  machineId: string
  machineName: string
  reportType: "Falla" | "Mantenimiento" | "Calibración"
  description: string
  reportedBy: string
  reportDate?: string | null
  status: "Pendiente" | "En proceso" | "Completado"
  priority: "Alta" | "Media" | "Baja"
  assignedTo?: string
  completedDate?: string | null
  resolution?: string
  createdAt?: string
  updatedAt?: string
}

// Tipos para Registros de Uso
export interface UsageLog {
  id: string
  equipo_id: string
  equipo_nombre: string
  item_inventario_id: string
  item_inventario_nombre: string
  fecha: string | null
  cantidad_usada: number
  unidad_de_uso: string
  responsable?: string
  comentarios?: string
  created_at: string
  createdAt?: string
  updatedAt?: string
}

// Tipos para Notificaciones
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: "high" | "medium" | "low"
  relatedId?: string
  read: boolean
  createdAt: string
  updatedAt?: string
}

// Tipos para Usuarios
export interface User {
  id: string
  email: string
  displayName?: string
  role: "admin" | "user" | "technician"
  createdAt?: string
  updatedAt?: string
}

export interface MachinePart {
  id: string
  machineId: string
  inventoryItemId: string
  name: string
  installationDate: string
  usageType: string
  maxUsage: number
  currentUsage: number
  status: "Normal" | "Advertencia" | "Crítico"
}

export interface MaintenancePart {
  id: string
  mantenimiento_id: string
  item_inventario_id: string
  item_inventario_nombre: string
  cantidad_utilizada: number
  costo_unitario: number
  total_costo: number
  fecha_registro: string
}
