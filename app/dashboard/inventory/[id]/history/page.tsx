"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Filter, User } from "lucide-react"
import { getInventoryItemHistory, filterHistoryData } from "@/app/actions/history"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExportButtons } from "@/components/export-buttons"
import { useToast } from "@/hooks/use-toast"

export default function InventoryItemHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [itemData, setItemData] = useState<any>(null)

  // Estados para filtros
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [responsible, setResponsible] = useState("")

  // Estados para datos filtrados
  const [filteredUsageLogs, setFilteredUsageLogs] = useState<any[]>([])
  const [filteredMaintenanceParts, setFilteredMaintenanceParts] = useState<any[]>([])

  useEffect(() => {
    const fetchItemHistory = async () => {
      try {
        const data = await getInventoryItemHistory(Number.parseInt(params.id))
        if (data.success) {
          setItemData(data)
          setFilteredUsageLogs(data.usageLogs)
          setFilteredMaintenanceParts(data.maintenanceParts)
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          })
          router.push("/dashboard/inventory")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el historial del ítem.",
          variant: "destructive",
        })
        router.push("/dashboard/inventory")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItemHistory()
  }, [params.id, router, toast])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (itemData) {
      setFilteredUsageLogs(filterHistoryData(itemData.usageLogs, startDate, endDate, responsible))

      // Para los mantenimientos, necesitamos filtrar por la fecha del mantenimiento
      const filteredParts = itemData.maintenanceParts.filter((item) => {
        const maintenance = item.maintenance
        const dateToCheck = maintenance.startDate

        // Filtrar por fecha
        if (startDate && dateToCheck < startDate) {
          return false
        }
        if (endDate && dateToCheck > endDate) {
          return false
        }

        // Filtrar por responsable
        if (responsible && !maintenance.technician.toLowerCase().includes(responsible.toLowerCase())) {
          return false
        }

        return true
      })

      setFilteredMaintenanceParts(filteredParts)
    }
  }, [itemData, startDate, endDate, responsible])

  // Preparar datos para exportación
  const usageLogsExportData = filteredUsageLogs.map((log) => ({
    fecha: new Date(log.fecha).toLocaleDateString(),
    equipo: log.equipo_nombre,
    cantidad: log.cantidad_usada,
    unidad: log.unidad_de_uso,
    responsable: log.responsable,
    comentarios: log.comentarios || "",
  }))

  const maintenancePartsExportData = filteredMaintenanceParts.map(({ maintenance, part }) => ({
    fecha: new Date(maintenance.startDate).toLocaleDateString(),
    equipo: maintenance.machineName,
    tipo_mantenimiento: maintenance.maintenanceType,
    cantidad: part.cantidad_utilizada,
    costo_unitario: part.costo_unitario,
    costo_total: part.total_costo,
    tecnico: maintenance.technician,
  }))

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  if (!itemData) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-gray-500">Ítem de inventario no encontrado.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/inventory")} className="mt-4">
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/inventory`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-optilab-blue">Historial: {itemData.item.name}</h1>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{itemData.stats.totalUsed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uso en Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{itemData.stats.totalUsedInMaintenance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registros de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{itemData.stats.totalUsageLogs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${itemData.stats.totalCost.toFixed(2)}</p>
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
            <TabsTrigger value="maintenance">Uso en Mantenimientos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="usage" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <ExportButtons
              title={`Registros de Uso - ${itemData.item.name}`}
              headers={["Fecha", "Equipo", "Cantidad", "Unidad", "Responsable", "Comentarios"]}
              data={usageLogsExportData}
              filename={`uso_${itemData.item.name.replace(/\s+/g, "_").toLowerCase()}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registros de Uso</CardTitle>
              <CardDescription>Historial de uso de este ítem en equipos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Equipo</TableHead>
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
                        <TableCell>{log.equipo_nombre}</TableCell>
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
              title={`Uso en Mantenimientos - ${itemData.item.name}`}
              headers={[
                "Fecha",
                "Equipo",
                "Tipo Mantenimiento",
                "Cantidad",
                "Costo Unitario",
                "Costo Total",
                "Técnico",
              ]}
              data={maintenancePartsExportData}
              filename={`mantenimientos_${itemData.item.name.replace(/\s+/g, "_").toLowerCase()}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso en Mantenimientos</CardTitle>
              <CardDescription>Historial de uso de este ítem como repuesto en mantenimientos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo Mantenimiento</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Técnico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenanceParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay registros de uso en mantenimientos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaintenanceParts.map(({ maintenance, part }, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(maintenance.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{maintenance.machineName}</TableCell>
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
                        <TableCell>{part.cantidad_utilizada}</TableCell>
                        <TableCell>${part.costo_unitario.toFixed(2)}</TableCell>
                        <TableCell>${part.total_costo.toFixed(2)}</TableCell>
                        <TableCell>{maintenance.technician}</TableCell>
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
