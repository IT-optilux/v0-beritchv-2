"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { UsageLog } from "@/types"
import { getUsageLogs, deleteUsageLog } from "@/app/actions/usage-logs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { UsageLogForm } from "@/components/usage-logs/usage-log-form"
import { UsageAlerts } from "@/components/usage-logs/usage-alerts"
import { useToast } from "@/hooks/use-toast"

// Importar los nuevos componentes y formateadores
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { ResponsiveFilters } from "@/components/ui/responsive-filters"
import { formatDate } from "@/lib/formatters"

export default function UsageLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<UsageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [equipoFilter, setEquipoFilter] = useState("")
  const [itemFilter, setItemFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<UsageLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getUsageLogs()
        setLogs(data)
        setFilteredLogs(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros de uso.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [toast])

  useEffect(() => {
    let result = logs

    // Aplicar filtro de búsqueda
    if (searchQuery) {
      result = result.filter(
        (log) =>
          log.equipo_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.item_inventario_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.responsable.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.comentarios && log.comentarios.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Aplicar filtro de equipo
    if (equipoFilter) {
      result = result.filter((log) => log.equipo_id === Number(equipoFilter))
    }

    // Aplicar filtro de ítem
    if (itemFilter) {
      result = result.filter((log) => log.item_inventario_id === Number(itemFilter))
    }

    // Aplicar filtro de fecha
    if (dateFilter) {
      result = result.filter((log) => log.fecha === dateFilter)
    }

    setFilteredLogs(result)
  }, [logs, searchQuery, equipoFilter, itemFilter, dateFilter])

  const handleEdit = (log: UsageLog) => {
    setSelectedLog(log)
    setIsEditModalOpen(true)
  }

  const handleDelete = (log: UsageLog) => {
    setSelectedLog(log)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedLog) return

    setIsDeleting(true)
    try {
      const result = await deleteUsageLog(selectedLog.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setLogs(logs.filter((log) => log.id !== selectedLog.id))
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al eliminar el registro.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedLog(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getUsageLogs()
      setLogs(data)
      setFilteredLogs(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  // Obtener equipos únicos para el filtro
  const equipos = [...new Set(logs.map((log) => log.equipo_id))].map((id) => {
    const log = logs.find((log) => log.equipo_id === id)
    return { id, nombre: log?.equipo_nombre || "" }
  })

  // Obtener ítems únicos para el filtro
  const items = [...new Set(logs.map((log) => log.item_inventario_id))].map((id) => {
    const log = logs.find((log) => log.item_inventario_id === id)
    return { id, nombre: log?.item_inventario_nombre || "" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Registro Semanal de Uso</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Registro
        </Button>
      </div>

      {/* Sección de alertas de uso */}
      <UsageAlerts />

      <Card>
        <CardHeader>
          <CardTitle>Registros de Uso</CardTitle>
          <CardDescription>Gestione los registros de uso de equipos e inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveFilters
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar registros..."
            filters={[
              {
                name: "equipo",
                value: equipoFilter,
                options: [
                  { value: "", label: "Todos los equipos" },
                  ...equipos.map((equipo) => ({
                    value: equipo.id.toString(),
                    label: equipo.nombre,
                  })),
                ],
                onChange: setEquipoFilter,
              },
              {
                name: "item",
                value: itemFilter,
                options: [
                  { value: "", label: "Todos los ítems" },
                  ...items.map((item) => ({
                    value: item.id.toString(),
                    label: item.nombre,
                  })),
                ],
                onChange: setItemFilter,
              },
            ]}
            className="mb-4"
          />

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <ResponsiveTable
              headers={["Fecha", "Equipo", "Ítem", "Cantidad", "Unidad", "Responsable", "Acciones"]}
              data={filteredLogs}
              keyField="id"
              emptyMessage={
                logs.length === 0
                  ? "No hay registros de uso disponibles."
                  : "No se encontraron registros que coincidan con los filtros."
              }
              renderCell={(log, header, index) => {
                switch (header) {
                  case "Fecha":
                    return formatDate(log.fecha)
                  case "Equipo":
                    return <span className="font-medium">{log.equipo_nombre}</span>
                  case "Ítem":
                    return log.item_inventario_nombre
                  case "Cantidad":
                    return log.cantidad_usada
                  case "Unidad":
                    return log.unidad_de_uso
                  case "Responsable":
                    return log.responsable
                  case "Acciones":
                    return (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(log)} className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4 text-optilab-blue" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(log)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )
                  default:
                    return null
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar registro */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Nuevo Registro de Uso"
        size="lg"
      >
        <UsageLogForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar registro */}
      {selectedLog && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedLog(null)
          }}
          title="Editar Registro de Uso"
          size="lg"
        >
          <UsageLogForm
            log={selectedLog}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedLog(null)
            }}
            onSuccess={refreshData}
          />
        </Modal>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedLog(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Registro de Uso"
        message={`¿Está seguro que desea eliminar este registro de uso? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}
