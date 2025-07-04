"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, PenToolIcon as Tool } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Modal } from "@/components/ui/modal"
import { obtenerInformacionDeUso } from "@/app/actions/usage-logs"
import { MaintenanceForm } from "@/components/usage-logs/maintenance-form"

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

  useEffect(() => {
    const fetchUsageInfo = async () => {
      try {
        const data = await obtenerInformacionDeUso()
        setUsageInfo(data)
      } catch (error) {
        console.error("Error al obtener información de uso:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageInfo()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchUsageInfo, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleMaintenanceClick = (item: UsageInfo) => {
    setSelectedItem(item)
    setIsMaintenanceModalOpen(true)
  }

  const handleMaintenanceSuccess = () => {
    // Actualizar la información de uso después de registrar mantenimiento
    obtenerInformacionDeUso().then((data) => {
      setUsageInfo(data)
    })
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Alertas de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleMaintenanceClick(item)}
                  >
                    <Tool className="mr-1 h-4 w-4" />
                    Registrar Mantenimiento
                  </Button>
                )}
              </div>

              <div className="mb-1 flex items-center justify-between text-sm">
                <span>
                  Uso: {item.uso_acumulado} de {item.vida_util_maxima} {item.unidad_de_uso}
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
        </CardContent>
      </Card>

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
