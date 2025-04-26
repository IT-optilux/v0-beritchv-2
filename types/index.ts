// Tipos para máquinas/equipos
export interface Machine {
  id: number
  name: string
  model: string
  serialNumber: string
  status: "Operativa" | "Mantenimiento" | "Inoperativa"
  lastMaintenance: string
  nextMaintenance: string
  description?: string
  location?: string
  purchaseDate?: string
  manufacturer?: string
  item_inventario_asociado?: number
}

// Tipos para reportes
export interface Report {
  id: number
  machineId: number
  machineName: string
  reportType: "Falla" | "Mantenimiento" | "Calibración"
  description: string
  reportedBy: string
  reportDate: string
  status: "Pendiente" | "En proceso" | "Completado"
  priority: "Alta" | "Media" | "Baja"
  resolution?: string
  completedDate?: string
  assignedTo?: string
}

// Tipos para inventario
export interface InventoryItem {
  id: number
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
  tipo_de_item?: "consumible" | "pieza de desgaste" | "repuesto general" // Nuevo campo: tipo de ítem
  unidad_de_uso?: string // Nuevo campo: unidad de uso (horas, cortes, etc.)
  vida_util_maxima?: number // Nuevo campo: vida útil máxima
  lifespanUnit?: string // Para compatibilidad con código existente
  lifespan?: number // Para compatibilidad con código existente
}

// Tipos para notificaciones
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  read: boolean
  severity: "high" | "medium" | "low"
  relatedId?: string
}

// Tipos para piezas de máquinas
export interface MachinePart {
  id: number
  machineId: number
  inventoryItemId: number
  name: string
  installationDate: string
  usageType: string
  maxUsage: number
  currentUsage: number
  status: "Normal" | "Advertencia" | "Crítico"
}

// Tipo para registros de uso
export interface UsageLog {
  id: number
  equipo_id: number
  equipo_nombre: string
  item_inventario_id: number
  item_inventario_nombre: string
  fecha: string
  cantidad_usada: number
  unidad_de_uso: string
  responsable: string
  comentarios?: string
  created_at: string
}

// Nuevo tipo para mantenimientos
export interface Maintenance {
  id: number
  machineId: number
  machineName: string
  maintenanceType: "Preventivo" | "Correctivo" | "Calibración"
  description: string
  startDate: string
  endDate?: string
  status: "Programado" | "En proceso" | "Completado" | "Cancelado"
  technician: string
  cost?: number
  observations?: string
}

// Nuevo tipo para repuestos utilizados en mantenimientos
export interface MaintenancePart {
  id: number
  mantenimiento_id: number
  item_inventario_id: number
  item_inventario_nombre: string
  cantidad_utilizada: number
  costo_unitario: number
  total_costo: number
  fecha_registro: string
}
