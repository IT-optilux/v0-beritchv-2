"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Clipboard, PenToolIcon as Tool, Calendar, Info, Package } from "lucide-react"
import type { Machine, InventoryItem, Maintenance, Report } from "@/types"
import { machineService, inventoryService, maintenanceService, reportService } from "@/lib/firebase-services"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Modal } from "@/components/ui/modal"
import { MachineForm } from "@/components/machines/machine-form"
import { ExportPdfButton } from "@/components/export-pdf-button"
import { useToast } from "@/hooks/use-toast"

export default function MachineDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [associatedItem, setAssociatedItem] = useState<InventoryItem | null>(null)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        setIsLoading(true)

        // Fetch machine data
        const machineData = await machineService.getById(params.id)
        if (!machineData) {
          toast({
            title: "Error",
            description: "Equipo no encontrado.",
            variant: "destructive",
          })
          router.push("/dashboard/machines")
          return
        }

        setMachine(machineData)

        // Fetch associated inventory item if exists
        if (machineData.item_inventario_asociado) {
          try {
            const itemData = await inventoryService.getById(machineData.item_inventario_asociado.toString())
            setAssociatedItem(itemData)
          } catch (error) {
            console.error("Error al cargar el ítem asociado:", error)
          }
        }

        // Fetch maintenance history
        try {
          const maintenanceData = await maintenanceService.getByMachineId(Number(machineData.id))
          setMaintenances(maintenanceData)
        } catch (error) {
          console.error("Error al cargar mantenimientos:", error)
        }

        // Fetch reports
        try {
          const reportsData = await reportService.getByMachineId(Number(machineData.id))
          setReports(reportsData)
        } catch (error) {
          console.error("Error al cargar reportes:", error)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información del equipo.",
          variant: "destructive",
        })
        router.push("/dashboard/machines")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMachine()
  }, [params.id, router, toast])

  const refreshData = async () => {
    try {
      // Fetch machine data
      const machineData = await machineService.getById(params.id)
      if (machineData) {
        setMachine(machineData)

        // Fetch associated inventory item if exists
        if (machineData.item_inventario_asociado) {
          const itemData = await inventoryService.getById(machineData.item_inventario_asociado.toString())
          setAssociatedItem(itemData)
        } else {
          setAssociatedItem(null)
        }

        // Refresh maintenance history
        const maintenanceData = await maintenanceService.getByMachineId(Number(machineData.id))
        setMaintenances(maintenanceData)

        // Refresh reports
        const reportsData = await reportService.getByMachineId(Number(machineData.id))
        setReports(reportsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del equipo.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-gray-500">Equipo no encontrado.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/machines")} className="mt-4">
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/machines")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-optilab-blue">{machine.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportPdfButton
            type="machine"
            data={machine}
            additionalData={{ maintenances, reports }}
            filename={`equipo_${machine.name.replace(/\s+/g, "_").toLowerCase()}.pdf`}
            variant="outline"
            className="hidden sm:flex"
          />
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/machines/${params.id}/history`)}
            className="text-optilab-blue hover:bg-optilab-blue/10"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Ver Historial
          </Button>
          <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Equipo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{machine.model}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Número de Serie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{machine.serialNumber}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                machine.status === "Operativa"
                  ? "bg-green-100 text-green-800"
                  : machine.status === "Mantenimiento"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {machine.status}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <Info className="mr-2 h-4 w-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Tool className="mr-2 h-4 w-4" />
            Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventario Asociado
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Clipboard className="mr-2 h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Detalles completos del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fabricante</h3>
                  <p className="mt-1">{machine.manufacturer || "No especificado"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ubicación</h3>
                  <p className="mt-1">{machine.location || "No especificada"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Compra</h3>
                  <p className="mt-1">
                    {machine.purchaseDate ? new Date(machine.purchaseDate).toLocaleDateString() : "No especificada"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1">{machine.description || "Sin descripción"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Mantenimiento</CardTitle>
                <CardDescription>Registro de mantenimientos realizados</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/maintenance/new?machineId=" + machine.id)}
              >
                <Tool className="mr-2 h-4 w-4" />
                Programar Mantenimiento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-optilab-blue" />
                      <h3 className="font-medium">Último Mantenimiento</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {machine.lastMaintenance
                        ? new Date(machine.lastMaintenance).toLocaleDateString()
                        : "No registrado"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-optilab-blue" />
                      <h3 className="font-medium">Próximo Mantenimiento</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {machine.nextMaintenance
                        ? new Date(machine.nextMaintenance).toLocaleDateString()
                        : "No programado"}
                    </p>
                  </div>
                </div>

                {maintenances.length > 0 ? (
                  <div className="space-y-4">
                    {maintenances.map((maintenance) => (
                      <div key={maintenance.id} className="rounded-lg border p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tool
                              className={`h-5 w-5 ${
                                maintenance.maintenanceType === "Preventivo"
                                  ? "text-blue-500"
                                  : maintenance.maintenanceType === "Correctivo"
                                    ? "text-red-500"
                                    : "text-amber-500"
                              }`}
                            />
                            <h3 className="font-medium">{maintenance.maintenanceType}</h3>
                          </div>
                          <div
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              maintenance.status === "Completado"
                                ? "bg-green-100 text-green-800"
                                : maintenance.status === "En proceso"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {maintenance.status}
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{maintenance.description}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Fecha: {new Date(maintenance.startDate || "").toLocaleDateString()}</span>
                          <span>Técnico: {maintenance.technician}</span>
                        </div>
                        <Button
                          variant="link"
                          className="mt-2 h-auto p-0 text-xs text-optilab-blue"
                          onClick={() => router.push(`/dashboard/maintenance/${maintenance.id}`)}
                        >
                          Ver detalles →
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4">
                    <p className="text-center text-sm text-gray-500">
                      No hay mantenimientos registrados para este equipo.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña para mostrar el ítem de inventario asociado */}
        <TabsContent value="inventory" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ítem de Inventario Asociado</CardTitle>
              <CardDescription>Información del ítem de inventario vinculado a este equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {associatedItem ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Nombre del Ítem</h3>
                      <p className="mt-1 font-medium">{associatedItem.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Categoría</h3>
                      <p className="mt-1">{associatedItem.category}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tipo de Ítem</h3>
                      <p className="mt-1">{associatedItem.tipo_de_item || "No especificado"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cantidad Disponible</h3>
                      <p className="mt-1">{associatedItem.quantity}</p>
                    </div>
                    {associatedItem.tipo_de_item === "pieza de desgaste" && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Unidad de Uso</h3>
                          <p className="mt-1">{associatedItem.unidad_de_uso || "No especificada"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Vida Útil Máxima</h3>
                          <p className="mt-1">{associatedItem.vida_util_maxima || "No especificada"}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Ubicación</h3>
                      <p className="mt-1">{associatedItem.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Proveedor</h3>
                      <p className="mt-1">{associatedItem.supplier || "No especificado"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                    <p className="mt-1">{associatedItem.description || "Sin descripción"}</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/inventory/${associatedItem.id}`)}
                      className="text-optilab-blue hover:bg-optilab-blue/10"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Ver en Inventario
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">No hay ningún ítem de inventario asociado a este equipo.</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="mt-4 text-optilab-blue hover:bg-optilab-blue/10"
                  >
                    Asociar Ítem de Inventario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reportes Asociados</CardTitle>
                <CardDescription>Reportes de fallas y mantenimientos</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/reports/new?machineId=${machine.id}`)}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Crear Reporte
              </Button>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clipboard
                            className={`h-5 w-5 ${
                              report.reportType === "Falla"
                                ? "text-red-500"
                                : report.reportType === "Mantenimiento"
                                  ? "text-blue-500"
                                  : "text-amber-500"
                            }`}
                          />
                          <h3 className="font-medium">{report.reportType}</h3>
                        </div>
                        <div
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            report.status === "Completado"
                              ? "bg-green-100 text-green-800"
                              : report.status === "En proceso"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status}
                        </div>
                      </div>
                      <p className="mt-2 text-sm">{report.description}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Fecha: {new Date(report.reportDate || "").toLocaleDateString()}</span>
                        <span>Reportado por: {report.reportedBy}</span>
                      </div>
                      <Button
                        variant="link"
                        className="mt-2 h-auto p-0 text-xs text-optilab-blue"
                        onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                      >
                        Ver detalles →
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border p-4">
                  <p className="text-center text-sm text-gray-500">No hay reportes registrados para este equipo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para editar equipo */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Equipo" size="lg">
        <MachineForm machine={machine} isEditing onClose={() => setIsEditModalOpen(false)} onSuccess={refreshData} />
      </Modal>
    </div>
  )
}
