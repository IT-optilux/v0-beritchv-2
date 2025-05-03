"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, PenToolIcon as Tool } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Modal } from "@/components/ui/modal"
import { MaintenanceForm } from "@/components/usage-logs/maintenance-form"
import { usageLogService, inventoryService } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface UsageInfo {
  key: string
  equipo_id: number
  equipo_nombre: string
  item_inventario_id: number
  item_inventario_nombre: string
  unidad_de_uso: string
  uso_acumulado: number
  vida_util_maxima: number
  porcentaje_uso: number
  requiere_mantenimiento: boolean
  alerta: boolean
}

export function UsageAlerts() {
  const [usageInfo, setUsageInfo] = useState<UsageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UsageInfo | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsageInfo = async () => {
      try {
        setLoading(true)

        // Get all inventory items that are wear parts
        const inventoryItems = await inventoryService.getAll()
        const wearParts = inventoryItems.filter((item) => item.tipo_de_item === "pieza de desgaste")

        // Get usage logs for each wear part
        const usageInfoPromises = wearParts.map(async (item) => {
          // Get all usage logs for this item
          const logs = await usageLogService.getByInventoryItemId(Number(item.id))

          // Group logs by equipment
          const equipmentGroups = logs.reduce(
            (groups, log) => {
              const key = `${log.equipo_id}`
              if (!groups[key]) {
                groups[key] = {
                  equipo_id: log.equipo_id,
                  equipo_nombre: log.equipo_nombre,
                  logs: [],
                }
              }
              groups[key].logs.push(log)
              return groups
            },
            {} as Record<string, { equipo_id: number; equipo_nombre: string; logs: typeof logs }>,
          )

          // Calculate usage info for each equipment
          return Object.values(equipmentGroups).map((group) => {
            const uso_acumulado = group.logs.reduce((total, log) => total + log.cantidad_usada, 0)
            const porcentaje_uso = item.vida_util_maxima ? (uso_acumulado / item.vida_util_maxima) * 100 : 0

            return {
              key: `${group.equipo_id}_${item.id}`,
              equipo_id: group.equipo_id,
              equipo_nombre: group.equipo_nombre,
              item_inventario_id: Number(item.id),
              item_inventario_nombre: item.name,
              unidad_de_uso: item.unidad_de_uso || "",
              uso_acumulado,
              vida_util_maxima: item.vida_util_maxima || 0,
              porcentaje_uso,
              requiere_mantenimiento: porcentaje_uso >= 100,
              alerta: porcentaje_uso >= 75,
            }
          })
        })

        // Flatten the array of arrays
        const allUsageInfo = (await Promise.all(usageInfoPromises)).flat()

        // Filter only items with alerts
        const alertItems = allUsageInfo.filter((item) => item.alerta || item.requiere_mantenimiento)

        setUsageInfo(alertItems)
      } catch (error) {
        console.error("Error al obtener información de uso:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información de uso",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsageInfo()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchUsageInfo, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [toast])

  const handleMaintenanceClick = (item: UsageInfo) => {
    setSelectedItem(item)
    setIsMaintenanceModalOpen(true)
  }

  const handleMaintenanceSuccess = () => {
    toast({
      title: "Éxito",
      description: "Mantenimiento registrado correctamente",
    })

    // Refresh data
    setIsMaintenanceModalOpen(false)
    setSelectedItem(null)

    // Remove the item from the list
    setUsageInfo(usageInfo.filter((item) => item.key !== selectedItem?.key))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
        </CardContent>
      </Card>
    )
  }

  // Filtrar solo los ítems que tienen alerta o requieren mantenimiento
  const itemsConAlerta = usageInfo.filter((item) => item.alerta || item.requiere_mantenimiento)

  if (itemsConAlerta.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-center">
          <p className="text-gray-500">No hay alertas de uso activas.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {itemsConAlerta.map((item) => (
          <div
            key={item.key}
            className={`rounded-lg border p-4 ${
              item.requiere_mantenimiento ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-5 w-5 ${item.requiere_mantenimiento ? "text-red-500" : "text-amber-500"}`}
                />
                <h3 className="font-medium">
                  {item.item_inventario_nombre} en {item.equipo_nombre}
                </h3>
              </div>
              {item.requiere_mantenimiento && (
                <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleMaintenanceClick(item)}>
                  <Tool className="mr-1 h-4 w-4" />
                  Registrar Mantenimiento
                </Button>
              )}
            </div>

            <div className="mb-1 flex items-center justify-between text-sm">
              <span>
                Uso: {item.uso_acumulado.toLocaleString()} de {item.vida_util_maxima.toLocaleString()}{" "}
                {item.unidad_de_uso}
              </span>
              <span className={`font-medium ${item.requiere_mantenimiento ? "text-red-700" : "text-amber-700"}`}>
                {item.porcentaje_uso.toFixed(1)}%
              </span>
            </div>

            <Progress
              value={Math.min(item.porcentaje_uso, 100)}
              className={`h-2 ${item.requiere_mantenimiento ? "bg-red-100" : "bg-amber-100"}`}
              indicatorClassName={`${item.requiere_mantenimiento ? "bg-red-500" : "bg-amber-500"}`}
            />

            <p className="mt-2 text-sm">
              {item.requiere_mantenimiento
                ? "¡Se ha excedido el límite de uso! Se requiere mantenimiento inmediato."
                : "La pieza está cerca de su límite de uso. Considere programar un mantenimiento pronto."}
            </p>
          </div>
        ))}
      </div>

      {/* Modal para registrar mantenimiento */}
      {selectedItem && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => {
            setIsMaintenanceModalOpen(false)
            setSelectedItem(null)
          }}
          title="Registrar Mantenimiento"
          size="md"
        >
          <MaintenanceForm
            item={selectedItem}
            onClose={() => {
              setIsMaintenanceModalOpen(false)
              setSelectedItem(null)
            }}
            onSuccess={handleMaintenanceSuccess}
          />
        </Modal>
      )}
    </>
  )
}
