"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"
import { PieChartCustom } from "@/components/pie-chart-custom"
import { ExportPdfButton } from "@/components/export-pdf-button"
import { Calendar, Filter } from "lucide-react"
import {
  machineService,
  inventoryService,
  maintenanceService,
  reportService,
  usageLogService,
} from "@/lib/firebase-services"
import type { Machine, InventoryItem, Maintenance, Report, UsageLog } from "@/types"
import { useToast } from "@/hooks/use-toast"

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("month")
  const [machines, setMachines] = useState<Machine[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [selectedMachine, setSelectedMachine] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Formateador para valores de eficiencia
  const formatPercent = (value: number) => `${value}%`

  // Formateador para valores enteros
  const formatInteger = (value: number) => `${value}`

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all data
        const machinesData = await machineService.getAll()
        const inventoryData = await inventoryService.getAll()
        const maintenanceData = await maintenanceService.getAll()
        const reportsData = await reportService.getAll()
        const usageLogsData = await usageLogService.getAll()

        setMachines(machinesData)
        setInventoryItems(inventoryData)
        setMaintenances(maintenanceData)
        setReports(reportsData)
        setUsageLogs(usageLogsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos para el análisis",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Prepare data for charts
  const getMonthlyMaintenanceData = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const data = months.map((month) => ({
      month,
      preventivos: 0,
      correctivos: 0,
      calibraciones: 0,
    }))

    maintenances.forEach((maintenance) => {
      if (!maintenance.startDate) return

      const date = new Date(maintenance.startDate)
      const monthIndex = date.getMonth()

      if (maintenance.maintenanceType === "Preventivo") {
        data[monthIndex].preventivos++
      } else if (maintenance.maintenanceType === "Correctivo") {
        data[monthIndex].correctivos++
      } else if (maintenance.maintenanceType === "Calibración") {
        data[monthIndex].calibraciones++
      }
    })

    return data
  }

  const getEquipmentMaintenanceData = () => {
    const machineMap = new Map<
      string,
      {
        name: string
        preventivos: number
        correctivos: number
        calibraciones: number
        disponibilidad: number
      }
    >()

    machines.forEach((machine) => {
      machineMap.set(machine.id, {
        name: machine.name,
        preventivos: 0,
        correctivos: 0,
        calibraciones: 0,
        disponibilidad: machine.status === "Operativa" ? 100 : machine.status === "Mantenimiento" ? 50 : 0,
      })
    })

    maintenances.forEach((maintenance) => {
      const machineId = maintenance.machineId.toString()
      const machineData = machineMap.get(machineId)

      if (machineData) {
        if (maintenance.maintenanceType === "Preventivo") {
          machineData.preventivos++
        } else if (maintenance.maintenanceType === "Correctivo") {
          machineData.correctivos++
        } else if (maintenance.maintenanceType === "Calibración") {
          machineData.calibraciones++
        }
      }
    })

    return Array.from(machineMap.values())
  }

  const getInventoryStatusData = () => {
    // Filter by category if selected
    let filteredItems = inventoryItems
    if (selectedCategory !== "all") {
      filteredItems = inventoryItems.filter((item) => item.category === selectedCategory)
    }

    return filteredItems.map((item) => ({
      name: item.name,
      actual: item.quantity,
      minimo: item.minQuantity,
      porcentaje: item.minQuantity > 0 ? Math.round((item.quantity / item.minQuantity) * 100) : 0,
    }))
  }

  const getMonthlyDowntimeData = () => {
    // This would ideally come from real data, but for now we'll generate sample data
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return months.map((month) => ({
      month,
      horas: Math.floor(Math.random() * 20) + 5, // Random hours between 5 and 24
    }))
  }

  const getEfficiencyData = () => {
    // This would ideally be calculated from real data
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return months.map((month) => ({
      month,
      eficiencia: Math.floor(Math.random() * 15) + 80, // Random efficiency between 80% and 95%
    }))
  }

  const getResponseTimeData = () => {
    const machineMap = new Map<
      string,
      {
        equipo: string
        tiempo: number
        reportes: number
      }
    >()

    machines.forEach((machine) => {
      machineMap.set(machine.id, {
        equipo: machine.name,
        tiempo: 0,
        reportes: 0,
      })
    })

    reports.forEach((report) => {
      if (!report.reportDate || !report.completedDate || report.status !== "Completado") return

      const machineId = report.machineId.toString()
      const machineData = machineMap.get(machineId)

      if (machineData) {
        const reportDate = new Date(report.reportDate)
        const completedDate = new Date(report.completedDate)
        const responseTime = Math.floor((completedDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60)) // Hours

        machineData.tiempo += responseTime
        machineData.reportes++
      }
    })

    // Calculate average response time
    machineMap.forEach((data) => {
      if (data.reportes > 0) {
        data.tiempo = Math.round(data.tiempo / data.reportes)
      }
    })

    return Array.from(machineMap.values()).filter((data) => data.reportes > 0)
  }

  // Get unique categories for filter
  const categories = ["all", ...new Set(inventoryItems.map((item) => item.category))]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-optilab-blue">Informes y Análisis</h1>
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-optilab-blue">Informes y Análisis</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Año</SelectItem>
            </SelectContent>
          </Select>

          <ExportPdfButton
            type="inventory"
            data={inventoryItems}
            filename="analisis_inventario.pdf"
            variant="outline"
            className="h-10"
          />
        </div>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Tendencias Mensuales</TabsTrigger>
          <TabsTrigger value="equipment">Análisis por Equipo</TabsTrigger>
          <TabsTrigger value="inventory">Estado de Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos Mensuales</CardTitle>
              <CardDescription>Análisis de mantenimientos por tipo en los últimos meses</CardDescription>
            </CardHeader>
            <CardContent>
              {getMonthlyMaintenanceData().length > 0 ? (
                <BarChartCustom
                  data={getMonthlyMaintenanceData()}
                  dataKey="preventivos"
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Cantidad"
                  formatter={formatInteger}
                  height={300}
                  stacked
                  additionalDataKeys={[
                    { key: "correctivos", name: "Correctivos", color: "#f87171" },
                    { key: "calibraciones", name: "Calibraciones", color: "#fbbf24" },
                  ]}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiempo de Inactividad</CardTitle>
              <CardDescription>Horas de inactividad por mes</CardDescription>
            </CardHeader>
            <CardContent>
              {getMonthlyDowntimeData().length > 0 ? (
                <BarChartCustom
                  data={getMonthlyDowntimeData()}
                  dataKey="horas"
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Horas"
                  formatter={(value) => `${value}h`}
                  height={300}
                  colorIndex={1}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eficiencia Operativa</CardTitle>
              <CardDescription>Porcentaje de eficiencia operativa mensual</CardDescription>
            </CardHeader>
            <CardContent>
              {getEfficiencyData().length > 0 ? (
                <LineChartCustom
                  data={getEfficiencyData()}
                  lines={[{ dataKey: "eficiencia", color: "#003366", name: "Eficiencia" }]}
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Eficiencia (%)"
                  formatter={formatPercent}
                  domain={[75, 100]}
                  height={300}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Análisis por Equipo</h3>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos y Fallas por Equipo</CardTitle>
              <CardDescription>Comparativa de mantenimientos por tipo de equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {getEquipmentMaintenanceData().length > 0 ? (
                <BarChartCustom
                  data={getEquipmentMaintenanceData()}
                  dataKey="preventivos"
                  nameKey="name"
                  xAxisLabel="Equipo"
                  yAxisLabel="Cantidad"
                  formatter={formatInteger}
                  height={300}
                  layout="vertical"
                  stacked
                  additionalDataKeys={[
                    { key: "correctivos", name: "Correctivos", color: "#f87171" },
                    { key: "calibraciones", name: "Calibraciones", color: "#fbbf24" },
                  ]}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilidad por Equipo</CardTitle>
              <CardDescription>Porcentaje de disponibilidad por tipo de equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {getEquipmentMaintenanceData().length > 0 ? (
                <BarChartCustom
                  data={getEquipmentMaintenanceData()}
                  dataKey="disponibilidad"
                  nameKey="name"
                  xAxisLabel="Equipo"
                  yAxisLabel="Disponibilidad (%)"
                  formatter={formatPercent}
                  height={300}
                  colorIndex={2}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiempo de Respuesta a Reportes</CardTitle>
              <CardDescription>Tiempo promedio de respuesta a reportes por equipo (horas)</CardDescription>
            </CardHeader>
            <CardContent>
              {getResponseTimeData().length > 0 ? (
                <BarChartCustom
                  data={getResponseTimeData()}
                  dataKey="tiempo"
                  nameKey="equipo"
                  xAxisLabel="Equipo"
                  yAxisLabel="Horas"
                  formatter={(value) => `${value}h`}
                  height={300}
                  layout="vertical"
                  colorIndex={3}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Estado de Inventario</h3>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories
                  .filter((c) => c !== "all")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estado Actual del Inventario</CardTitle>
              <CardDescription>Comparativa entre niveles actuales y mínimos requeridos</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-6">
              {getInventoryStatusData().length > 0 ? (
                getInventoryStatusData().map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <span className="font-medium text-optilab-blue">{item.actual}</span> / {item.minimo} mínimo
                        </span>
                      </div>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${
                          item.actual < item.minimo ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, (item.actual / item.minimo) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-[200px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Inventario por Categoría</CardTitle>
              <CardDescription>Cantidad de ítems por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryItems.length > 0 ? (
                <div className="h-[300px]">
                  <PieChartCustom
                    data={categories
                      .filter((c) => c !== "all")
                      .map((category) => ({
                        name: category,
                        value: inventoryItems.filter((item) => item.category === category).length,
                      }))}
                    nameKey="name"
                    dataKey="value"
                    colors={["#60a5fa", "#f87171", "#fbbf24", "#4ade80", "#a78bfa"]}
                  />
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Inventario por Categoría</CardTitle>
              <CardDescription>Distribución de estados por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryItems.length > 0 ? (
                <BarChartCustom
                  data={categories
                    .filter((c) => c !== "all")
                    .map((category) => {
                      const items = inventoryItems.filter((item) => item.category === category)
                      return {
                        name: category,
                        enStock: items.filter((item) => item.status === "En stock").length,
                        bajoStock: items.filter((item) => item.status === "Bajo stock").length,
                        sinStock: items.filter((item) => item.status === "Sin stock").length,
                      }
                    })}
                  dataKey="enStock"
                  nameKey="name"
                  xAxisLabel="Categoría"
                  yAxisLabel="Cantidad"
                  formatter={formatInteger}
                  height={300}
                  stacked
                  additionalDataKeys={[
                    { key: "bajoStock", name: "Bajo Stock", color: "#fbbf24" },
                    { key: "sinStock", name: "Sin Stock", color: "#f87171" },
                  ]}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
