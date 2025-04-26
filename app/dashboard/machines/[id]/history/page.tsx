"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Filter, User } from "lucide-react"
import { getMachineHistory, filterHistoryData } from "@/app/actions/history"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExportButtons } from "@/components/export-buttons"
import { useToast } from "@/hooks/use-toast"

export default function MachineHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [machineData, setMachineData] = useState<any>(null)

  // Estados para filtros
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [responsible, setResponsible] = useState("")

  // Estados para datos filtrados
  const [filteredUsageLogs, setFilteredUsageLogs] = useState<any[]>([])
  const [filteredMaintenances, setFilteredMaintenances] = useState<any[]>([])
  const [filteredParts, setFilteredParts] = useState<any[]>([])

  useEffect(() => {
    const fetchMachineHistory = async () => {
      try {
        const data = await getMachineHistory(Number.parseInt(params.id))
        if (data.success) {
          setMachineData(data)
          setFilteredUsageLogs(data.usageLogs)
          setFilteredMaintenances(data.maintenances)
          setFilteredParts(data.maintenanceParts)
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          })
          router.push("/dashboard/machines")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el historial del equipo.",
          variant: "destructive",
        })
        router.push("/dashboard/machines")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMachineHistory()
  }, [params.id, router, toast])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (machineData) {
      setFilteredUsageLogs(filterHistoryData(machineData.usageLogs, startDate, endDate, responsible))
      setFilteredMaintenances(filterHistoryData(machineData.maintenances, startDate, endDate, responsible))
      setFilteredParts(filterHistoryData(machineData.maintenanceParts, startDate, endDate, ""))
    }
  }, [machineData, startDate, endDate, responsible])

  // Preparar datos para exportación
  const usageLogsExportData = filteredUsageLogs.map((log) => ({
    fecha: new Date(log.fecha).toLocaleDateString(),
    item: log.item_inventario_nombre,
    cantidad: log.cantidad_usada,
    unidad: log.unidad_de_uso,
    responsable: log.responsable,
    comentarios: log.comentarios || "",
  }))

  const maintenancesExportData = filteredMaintenances.map((maintenance) => ({
    fecha_inicio: new Date(maintenance.startDate).toLocaleDateString(),
    fecha_fin: maintenance.endDate ? new Date(maintenance.endDate).toLocaleDateString() : "En proceso",
    tipo: maintenance.maintenanceType,
    estado: maintenance.status,
    tecnico: maintenance.technician,
    costo: maintenance.cost || 0,
    descripcion: maintenance.description,
  }))

  const partsExportData = filteredParts.map((part) => ({
    repuesto: part.item_inventario_nombre,
    cantidad: part.cantidad_utilizada,
    costo_unitario: part.costo_unitario,
    costo_total: part.total_costo,
    fecha: new Date(part.fecha_registro).toLocaleDateString(),
  }))

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  if (!machineData) {
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
          <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/machines/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-optilab-blue">Historial: {machineData.machine.name}</h1>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{machineData.stats.totalMaintenances}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registros de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{machineData.stats.totalUsageLogs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Piezas Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{machineData.stats.totalParts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${machineData.stats.totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Fecha Inicio</span>
              </div>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Fecha Fin</span>
              </div>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Responsable</span>
              </div>
              <Input
                type="text"
                placeholder="Nombre del responsable"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido en pestañas */}
      <Tabs defaultValue="usage">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="usage">Registros de Uso</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
            <TabsTrigger value="parts">Repuestos Utilizados</TabsTrigger>
          </TabsList>

          {/* Botones de exportación según la pestaña activa */}
          <div className="flex items-center gap-2" id="export-buttons-container">
            {/* Los botones de exportación se insertarán aquí mediante JavaScript */}
          </div>
        </div>

        <TabsContent value="usage" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButtons
              title={`Registros de Uso - ${machineData.machine.name}`}
              headers={["Fecha", "Ítem", "Cantidad", "Unidad", "Responsable", "Comentarios"]}
              data={usageLogsExportData}
              filename={`registros_uso_${machineData.machine.name.replace(/\s+/g, "_").toLowerCase()}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registros de Uso</CardTitle>
              <CardDescription>Historial de uso de ítems en este equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ítem</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Comentarios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsageLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay registros de uso disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsageLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(log.fecha).toLocaleDateString()}</TableCell>
                        <TableCell>{log.item_inventario_nombre}</TableCell>
                        <TableCell>{log.cantidad_usada}</TableCell>
                        <TableCell>{log.unidad_de_uso}</TableCell>
                        <TableCell>{log.responsable}</TableCell>
                        <TableCell>{log.comentarios || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButtons
              title={`Mantenimientos - ${machineData.machine.name}`}
              headers={["Fecha Inicio", "Fecha Fin", "Tipo", "Estado", "Técnico", "Costo", "Descripción"]}
              data={maintenancesExportData}
              filename={`mantenimientos_${machineData.machine.name.replace(/\s+/g, "_").toLowerCase()}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos</CardTitle>
              <CardDescription>Historial de mantenimientos realizados en este equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay mantenimientos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaintenances.map((maintenance, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(maintenance.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {maintenance.endDate ? new Date(maintenance.endDate).toLocaleDateString() : "En proceso"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              maintenance.maintenanceType === "Preventivo"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : maintenance.maintenanceType === "Correctivo"
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-blue-500 bg-blue-50 text-blue-700"
                            }
                          >
                            {maintenance.maintenanceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              maintenance.status === "Completado"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : maintenance.status === "En proceso"
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : maintenance.status === "Programado"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-red-500 bg-red-50 text-red-700"
                            }
                          >
                            {maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{maintenance.technician}</TableCell>
                        <TableCell>${maintenance.cost ? maintenance.cost.toFixed(2) : "0.00"}</TableCell>
                        <TableCell className="max-w-xs truncate">{maintenance.description}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButtons
              title={`Repuestos Utilizados - ${machineData.machine.name}`}
              headers={["Repuesto", "Cantidad", "Costo Unitario", "Costo Total", "Fecha"]}
              data={partsExportData}
              filename={`repuestos_${machineData.machine.name.replace(/\s+/g, "_").toLowerCase()}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repuestos Utilizados</CardTitle>
              <CardDescription>Historial de repuestos utilizados en este equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repuesto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay repuestos utilizados disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParts.map((part, index) => (
                      <TableRow key={index}>
                        <TableCell>{part.item_inventario_nombre}</TableCell>
                        <TableCell>{part.cantidad_utilizada}</TableCell>
                        <TableCell>${part.costo_unitario.toFixed(2)}</TableCell>
                        <TableCell>${part.total_costo.toFixed(2)}</TableCell>
                        <TableCell>{new Date(part.fecha_registro).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
