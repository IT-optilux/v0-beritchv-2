"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Search, Calendar } from "lucide-react"
import type { Maintenance } from "@/types"
import { getMaintenances, deleteMaintenance } from "@/app/actions/maintenance"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { useToast } from "@/hooks/use-toast"

// Importar el formateador de moneda
import { formatCurrency, formatDate } from "@/lib/formatters"

export default function MaintenancePage() {
  const { toast } = useToast()
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        const data = await getMaintenances()
        setMaintenances(data)
        setFilteredMaintenances(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los mantenimientos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaintenances()
  }, [toast])

  useEffect(() => {
    let result = maintenances

    // Aplicar filtro de búsqueda
    if (searchQuery) {
      result = result.filter(
        (maintenance) =>
          maintenance.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          maintenance.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          maintenance.technician.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Aplicar filtro de tipo
    if (typeFilter) {
      result = result.filter((maintenance) => maintenance.maintenanceType === typeFilter)
    }

    // Aplicar filtro de estado
    if (statusFilter) {
      result = result.filter((maintenance) => maintenance.status === statusFilter)
    }

    // Aplicar filtro de fecha
    if (dateFilter) {
      result = result.filter((maintenance) => maintenance.startDate === dateFilter)
    }

    setFilteredMaintenances(result)
  }, [maintenances, searchQuery, typeFilter, statusFilter, dateFilter])

  const handleEdit = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance)
    setIsEditModalOpen(true)
  }

  const handleDelete = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedMaintenance) return

    setIsDeleting(true)
    try {
      const result = await deleteMaintenance(selectedMaintenance.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setMaintenances(maintenances.filter((m) => m.id !== selectedMaintenance.id))
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
        description: "Ha ocurrido un error al eliminar el mantenimiento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedMaintenance(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getMaintenances()
      setMaintenances(data)
      setFilteredMaintenances(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Programado":
        return "border-blue-500 bg-blue-50 text-blue-700"
      case "En proceso":
        return "border-amber-500 bg-amber-50 text-amber-700"
      case "Completado":
        return "border-green-500 bg-green-50 text-green-700"
      case "Cancelado":
        return "border-red-500 bg-red-50 text-red-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Preventivo":
        return "border-green-500 bg-green-50 text-green-700"
      case "Correctivo":
        return "border-red-500 bg-red-50 text-red-700"
      case "Calibración":
        return "border-blue-500 bg-blue-50 text-blue-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Mantenimiento</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Mantenimiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Mantenimientos</CardTitle>
          <CardDescription>Gestione los mantenimientos de equipos del laboratorio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar mantenimientos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Calibración">Calibración</option>
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Programado">Programado</option>
              <option value="En proceso">En proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-40" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {maintenances.length === 0
                        ? "No hay mantenimientos registrados."
                        : "No se encontraron mantenimientos que coincidan con los filtros."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaintenances.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">{maintenance.machineName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeColor(maintenance.maintenanceType)}>
                          {maintenance.maintenanceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{maintenance.description}</TableCell>
                      <TableCell>{formatDate(maintenance.startDate)}</TableCell>
                      <TableCell>{maintenance.technician}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(maintenance.status)}>
                          {maintenance.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{maintenance.cost ? formatCurrency(maintenance.cost) : "No registrado"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(maintenance)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4 text-optilab-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(maintenance)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Link
                            href={`/dashboard/maintenance/${maintenance.id}`}
                            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-optilab-blue hover:bg-gray-100"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar mantenimiento */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Nuevo Mantenimiento"
        size="lg"
      >
        <MaintenanceForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar mantenimiento */}
      {selectedMaintenance && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedMaintenance(null)
          }}
          title="Editar Mantenimiento"
          size="lg"
        >
          <MaintenanceForm
            maintenance={selectedMaintenance}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedMaintenance(null)
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
          setSelectedMaintenance(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Mantenimiento"
        message={`¿Está seguro que desea eliminar este mantenimiento? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}
