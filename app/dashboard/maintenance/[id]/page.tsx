"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Info, Package, Plus, Trash2 } from "lucide-react"
import type { Maintenance, MaintenancePart } from "@/types"
import {
  getMaintenanceById,
  getMaintenancePartsByMaintenanceId,
  deleteMaintenancePart,
} from "@/app/actions/maintenance"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { MaintenancePartsForm } from "@/components/maintenance/maintenance-parts-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// Importar el formateador de moneda
import { formatCurrency, formatDate } from "@/lib/formatters"

export default function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
  const [maintenanceParts, setMaintenanceParts] = useState<MaintenancePart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false)
  const [isDeletePartDialogOpen, setIsDeletePartDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<MaintenancePart | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const maintenanceData = await getMaintenanceById(Number.parseInt(params.id))
        if (maintenanceData) {
          setMaintenance(maintenanceData)

          // Obtener los repuestos utilizados
          const partsData = await getMaintenancePartsByMaintenanceId(Number.parseInt(params.id))
          setMaintenanceParts(partsData)
        } else {
          toast({
            title: "Error",
            description: "Mantenimiento no encontrado.",
            variant: "destructive",
          })
          router.push("/dashboard/maintenance")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información del mantenimiento.",
          variant: "destructive",
        })
        router.push("/dashboard/maintenance")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, toast])

  const refreshData = async () => {
    try {
      const maintenanceData = await getMaintenanceById(Number.parseInt(params.id))
      if (maintenanceData) {
        setMaintenance(maintenanceData)

        // Obtener los repuestos utilizados
        const partsData = await getMaintenancePartsByMaintenanceId(Number.parseInt(params.id))
        setMaintenanceParts(partsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del mantenimiento.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePart = (part: MaintenancePart) => {
    setSelectedPart(part)
    setIsDeletePartDialogOpen(true)
  }

  const confirmDeletePart = async () => {
    if (!selectedPart) return

    setIsDeleting(true)
    try {
      const result = await deleteMaintenancePart(selectedPart.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        refreshData()
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
        description: "Ha ocurrido un error al eliminar el repuesto.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeletePartDialogOpen(false)
      setSelectedPart(null)
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  if (!maintenance) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-gray-500">Mantenimiento no encontrado.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/maintenance")} className="mt-4">
          Volver al listado
        </Button>
      </div>
    )
  }

  // Calcular el costo total de los repuestos
  const totalRepuestos = maintenanceParts.reduce((total, part) => total + part.total_costo, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/maintenance")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-optilab-blue">Mantenimiento: {maintenance.machineName}</h1>
        </div>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsEditModalOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Mantenimiento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getTypeBadgeColor(maintenance.maintenanceType)}>
              {maintenance.maintenanceType}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getStatusBadgeColor(maintenance.status)}>
              {maintenance.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{maintenance.technician}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <Info className="mr-2 h-4 w-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="parts">
            <Package className="mr-2 h-4 w-4" />
            Repuestos Utilizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Detalles completos del mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Equipo</h3>
                  <p className="mt-1">{maintenance.machineName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo de Mantenimiento</h3>
                  <p className="mt-1">{maintenance.maintenanceType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Inicio</h3>
                  <p className="mt-1">{formatDate(maintenance.startDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Finalización</h3>
                  <p className="mt-1">{maintenance.endDate ? formatDate(maintenance.endDate) : "No finalizado"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <p className="mt-1">{maintenance.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Técnico Responsable</h3>
                  <p className="mt-1">{maintenance.technician}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Costo Total</h3>
                  <p className="mt-1">{maintenance.cost ? formatCurrency(maintenance.cost) : "No registrado"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Costo de Repuestos</h3>
                  <p className="mt-1">{formatCurrency(totalRepuestos)}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1">{maintenance.description}</p>
                </div>
                {maintenance.observations && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Observaciones</h3>
                    <p className="mt-1">{maintenance.observations}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Repuestos Utilizados</CardTitle>
                <CardDescription>Registro de repuestos utilizados en este mantenimiento</CardDescription>
              </div>
              <Button
                className="bg-optilab-blue hover:bg-optilab-blue/90"
                onClick={() => setIsAddPartModalOpen(true)}
                disabled={maintenance.status === "Cancelado"}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Repuesto
              </Button>
            </CardHeader>
            <CardContent>
              {maintenanceParts.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center">
                  <Package className="mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">No hay repuestos registrados para este mantenimiento.</p>
                  {maintenance.status !== "Cancelado" && (
                    <Button
                      variant="link"
                      onClick={() => setIsAddPartModalOpen(true)}
                      className="mt-2 text-optilab-blue"
                    >
                      Agregar un repuesto
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repuesto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unitario</TableHead>
                      <TableHead>Costo Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.item_inventario_nombre}</TableCell>
                        <TableCell>{part.cantidad_utilizada}</TableCell>
                        <TableCell>{formatCurrency(part.costo_unitario)}</TableCell>
                        <TableCell>{formatCurrency(part.total_costo)}</TableCell>
                        <TableCell>{formatDate(part.fecha_registro)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePart(part)}
                            className="h-8 w-8 p-0"
                            disabled={maintenance.status === "Cancelado"}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(totalRepuestos)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para editar mantenimiento */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Mantenimiento" size="lg">
        <MaintenanceForm
          maintenance={maintenance}
          isEditing
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={refreshData}
        />
      </Modal>

      {/* Modal para agregar repuesto */}
      <Modal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        title="Agregar Repuesto Utilizado"
        size="md"
      >
        <MaintenancePartsForm
          maintenanceId={maintenance.id}
          onClose={() => setIsAddPartModalOpen(false)}
          onSuccess={refreshData}
        />
      </Modal>

      {/* Diálogo de confirmación para eliminar repuesto */}
      <ConfirmDialog
        isOpen={isDeletePartDialogOpen}
        onClose={() => {
          setIsDeletePartDialogOpen(false)
          setSelectedPart(null)
        }}
        onConfirm={confirmDeletePart}
        title="Eliminar Repuesto"
        message={`¿Está seguro que desea eliminar este repuesto? Esta acción devolverá la cantidad al inventario y no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}
