"use client"

import { useState, useEffect } from "react"
import { useAuthRequired } from "@/hooks/use-auth-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, AlertTriangle, PenToolIcon as Tool, Package, FileText, BarChart3 } from "lucide-react"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"
import { PieChartCustom } from "@/components/pie-chart-custom"
import { MaintenanceCalendar } from "@/components/maintenance/maintenance-calendar"
import { UsageAlerts } from "@/components/usage-logs/usage-alerts"
import { useRouter } from "next/navigation"
import {
  machineService,
  inventoryService,
  maintenanceService,
  reportService,
  notificationService,
} from "@/lib/firebase-services"
import type { Machine, InventoryItem, Maintenance, Report, Notification } from "@/types"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthRequired()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    machines: { total: 0, active: 0, maintenance: 0, inactive: 0 },
    inventory: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
    maintenance: { total: 0, scheduled: 0, inProgress: 0, completed: 0 },
    reports: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    notifications: { total: 0, unread: 0 },
  })
  const [machines, setMachines] = useState<Machine[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<Maintenance[]>([])
  const [timeframe, setTimeframe] = useState("month")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch all data
        const machinesData = await machineService.getAll()
        const inventoryData = await inventoryService.getAll()
        const maintenanceData = await maintenanceService.getAll()
        const reportsData = await reportService.getAll()
        const notificationsData = await notificationService.getAll()
        const upcomingMaintenancesData = await maintenanceService.getUpcoming(30)

        // Set state for each data type
        setMachines(machinesData)
        setInventoryItems(inventoryData)
        setMaintenances(maintenanceData)
        setReports(reportsData)
        setNotifications(notificationsData)
        setUpcomingMaintenances(upcomingMaintenancesData)

        // Calculate dashboard summary data
        setDashboardData({
          machines: {
            total: machinesData.length,
            active: machinesData.filter((m) => m.status === "Operativa").length,
            maintenance: machinesData.filter((m) => m.status === "Mantenimiento").length,
            inactive: machinesData.filter((m) => m.status === "Inactiva").length,
          },
          inventory: {
            total: inventoryData.length,
            inStock: inventoryData.filter((i) => i.status === "En stock").length,
            lowStock: inventoryData.filter((i) => i.status === "Bajo stock").length,
            outOfStock: inventoryData.filter((i) => i.status === "Sin stock").length,
          },
          maintenance: {
            total: maintenanceData.length,
            scheduled: maintenanceData.filter((m) => m.status === "Programado").length,
            inProgress: maintenanceData.filter((m) => m.status === "En proceso").length,
            completed: maintenanceData.filter((m) => m.status === "Completado").length,
          },
          reports: {
            total: reportsData.length,
            pending: reportsData.filter((r) => r.status === "Pendiente").length,
            inProgress: reportsData.filter((r) => r.status === "En proceso").length,
            completed: reportsData.filter((r) => r.status === "Completado").length,
          },
          notifications: {
            total: notificationsData.length,
            unread: notificationsData.filter((n) => !n.read).length,
          },
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchDashboardData()
    }
  }, [authLoading])

  // Prepare data for charts
  const machineStatusData = [
    { name: "Operativas", value: dashboardData.machines.active },
    { name: "En Mantenimiento", value: dashboardData.machines.maintenance },
    { name: "Inactivas", value: dashboardData.machines.inactive },
  ]

  const inventoryStatusData = [
    { name: "En Stock", value: dashboardData.inventory.inStock },
    { name: "Bajo Stock", value: dashboardData.inventory.lowStock },
    { name: "Sin Stock", value: dashboardData.inventory.outOfStock },
  ]

  const maintenanceStatusData = [
    { name: "Programados", value: dashboardData.maintenance.scheduled },
    { name: "En Proceso", value: dashboardData.maintenance.inProgress },
    { name: "Completados", value: dashboardData.maintenance.completed },
  ]

  const reportStatusData = [
    { name: "Pendientes", value: dashboardData.reports.pending },
    { name: "En Proceso", value: dashboardData.reports.inProgress },
    { name: "Completados", value: dashboardData.reports.completed },
  ]

  // Sample data for time-based charts (would be replaced with real data)
  const monthlyMaintenanceData = [
    { month: "Ene", preventivos: 5, correctivos: 2 },
    { month: "Feb", preventivos: 4, correctivos: 3 },
    { month: "Mar", preventivos: 6, correctivos: 1 },
    { month: "Abr", preventivos: 3, correctivos: 4 },
    { month: "May", preventivos: 7, correctivos: 2 },
    { month: "Jun", preventivos: 5, correctivos: 3 },
  ]

  const monthlyDowntimeData = [
    { month: "Ene", horas: 12 },
    { month: "Feb", horas: 8 },
    { month: "Mar", horas: 15 },
    { month: "Abr", horas: 6 },
    { month: "May", horas: 10 },
    { month: "Jun", horas: 9 },
  ]

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">
          Bienvenido, {user?.displayName || user?.email?.split("@")[0] || "Usuario"}
        </h1>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => router.push("/dashboard/analytics")}>
            <BarChart3 className="mr-1 h-4 w-4" />
            Ver Análisis Completo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="bg-optilab-blue/10 pb-2">
            <CardDescription className="flex items-center text-optilab-blue">
              <Tool className="mr-1 h-4 w-4" />
              Equipos
            </CardDescription>
            <CardTitle className="text-2xl text-optilab-blue">{dashboardData.machines.total} equipos</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">{dashboardData.machines.active} activos</span>
              <span className="text-amber-600">{dashboardData.machines.maintenance} en mantenimiento</span>
              <span className="text-red-600">{dashboardData.machines.inactive} inactivos</span>
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-optilab-blue"
              onClick={() => router.push("/dashboard/machines")}
            >
              Ver todos los equipos →
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-optilab-light/10 pb-2">
            <CardDescription className="flex items-center text-optilab-light">
              <Package className="mr-1 h-4 w-4" />
              Inventario
            </CardDescription>
            <CardTitle className="text-2xl text-optilab-light">{dashboardData.inventory.total} ítems</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">{dashboardData.inventory.inStock} en stock</span>
              <span className="text-amber-600">{dashboardData.inventory.lowStock} bajo stock</span>
              <span className="text-red-600">{dashboardData.inventory.outOfStock} sin stock</span>
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-optilab-light"
              onClick={() => router.push("/dashboard/inventory")}
            >
              Ver inventario completo →
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-amber-500/10 pb-2">
            <CardDescription className="flex items-center text-amber-600">
              <Tool className="mr-1 h-4 w-4" />
              Mantenimientos
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">{dashboardData.maintenance.scheduled} pendientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Próximo: {upcomingMaintenances[0]?.startDate || "No programado"}</span>
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-amber-600"
              onClick={() => router.push("/dashboard/maintenance")}
            >
              Ver mantenimientos →
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-red-500/10 pb-2">
            <CardDescription className="flex items-center text-red-600">
              <FileText className="mr-1 h-4 w-4" />
              Reportes
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{dashboardData.reports.pending} pendientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>{dashboardData.reports.inProgress} en proceso</span>
              <span>{dashboardData.reports.total} total</span>
            </div>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-xs text-red-600"
              onClick={() => router.push("/dashboard/reports")}
            >
              Ver todos los reportes →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different dashboard views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Equipos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <PieChartCustom
                    data={machineStatusData}
                    nameKey="name"
                    dataKey="value"
                    colors={["#4ade80", "#fbbf24", "#f87171"]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <PieChartCustom
                    data={inventoryStatusData}
                    nameKey="name"
                    dataKey="value"
                    colors={["#4ade80", "#fbbf24", "#f87171"]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Mantenimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMaintenances.length > 0 ? (
                    upcomingMaintenances.slice(0, 3).map((maintenance) => (
                      <div key={maintenance.id} className="flex items-start space-x-2">
                        <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-optilab-blue" />
                        <div>
                          <p className="font-medium">{maintenance.machineName}</p>
                          <p className="text-sm text-gray-500">
                            {maintenance.startDate} - {maintenance.maintenanceType}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-gray-500">No hay mantenimientos programados</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tiempo de Inactividad Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChartCustom
                  data={monthlyDowntimeData}
                  dataKey="horas"
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Horas"
                  formatter={(value) => `${value}h`}
                  height={300}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Calendario de Mantenimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceCalendar maintenances={maintenances} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mantenimientos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <PieChartCustom
                    data={[
                      {
                        name: "Preventivos",
                        value: maintenances.filter((m) => m.maintenanceType === "Preventivo").length,
                      },
                      {
                        name: "Correctivos",
                        value: maintenances.filter((m) => m.maintenanceType === "Correctivo").length,
                      },
                      {
                        name: "Calibración",
                        value: maintenances.filter((m) => m.maintenanceType === "Calibración").length,
                      },
                    ]}
                    nameKey="name"
                    dataKey="value"
                    colors={["#60a5fa", "#f87171", "#fbbf24"]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChartCustom
                  data={monthlyMaintenanceData}
                  dataKey="preventivos"
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Cantidad"
                  formatter={(value) => `${value}`}
                  height={300}
                  stacked
                  additionalDataKeys={[{ key: "correctivos", name: "Correctivos", color: "#f87171" }]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageAlerts />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notificaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-2 rounded-lg border p-3 ${
                        !notification.read ? "border-optilab-blue/30 bg-optilab-blue/5" : "border-gray-200"
                      }`}
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                          notification.severity === "high"
                            ? "text-red-500"
                            : notification.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500">No hay notificaciones recientes</p>
                )}

                {notifications.length > 5 && (
                  <Button
                    variant="link"
                    className="w-full text-xs text-optilab-blue"
                    onClick={() => router.push("/dashboard/notifications")}
                  >
                    Ver todas las notificaciones →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventario Bajo Mínimos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems.filter((item) => item.quantity <= item.minQuantity).length > 0 ? (
                  inventoryItems
                    .filter((item) => item.quantity <= item.minQuantity)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="flex items-start space-x-2 rounded-lg border p-3">
                        <Package
                          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                            item.quantity === 0 ? "text-red-500" : "text-amber-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="mt-1 flex items-center text-sm">
                            <span className={`font-medium ${item.quantity === 0 ? "text-red-500" : "text-amber-500"}`}>
                              {item.quantity}
                            </span>
                            <span className="mx-1 text-gray-500">/</span>
                            <span className="text-gray-500">{item.minQuantity} mínimo</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-sm text-gray-500">No hay ítems bajo mínimos</p>
                )}

                {inventoryItems.filter((item) => item.quantity <= item.minQuantity).length > 5 && (
                  <Button
                    variant="link"
                    className="w-full text-xs text-optilab-blue"
                    onClick={() => router.push("/dashboard/inventory")}
                  >
                    Ver todo el inventario →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Análisis de Rendimiento</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={timeframe === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("week")}
                className={timeframe === "week" ? "bg-optilab-blue hover:bg-optilab-blue/90" : ""}
              >
                Semana
              </Button>
              <Button
                variant={timeframe === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("month")}
                className={timeframe === "month" ? "bg-optilab-blue hover:bg-optilab-blue/90" : ""}
              >
                Mes
              </Button>
              <Button
                variant={timeframe === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("year")}
                className={timeframe === "year" ? "bg-optilab-blue hover:bg-optilab-blue/90" : ""}
              >
                Año
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mantenimientos vs. Fallas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChartCustom
                    data={[
                      { month: "Ene", mantenimientos: 5, fallas: 2 },
                      { month: "Feb", mantenimientos: 4, fallas: 3 },
                      { month: "Mar", mantenimientos: 6, fallas: 1 },
                      { month: "Abr", mantenimientos: 3, fallas: 4 },
                      { month: "May", mantenimientos: 7, fallas: 2 },
                      { month: "Jun", mantenimientos: 5, fallas: 3 },
                    ]}
                    lines={[
                      { dataKey: "mantenimientos", color: "#60a5fa", name: "Mantenimientos" },
                      { dataKey: "fallas", color: "#f87171", name: "Fallas" },
                    ]}
                    nameKey="month"
                    xAxisLabel="Mes"
                    yAxisLabel="Cantidad"
                    formatter={(value) => `${value}`}
                    height={300}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eficiencia Operativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChartCustom
                    data={[
                      { month: "Ene", eficiencia: 85 },
                      { month: "Feb", eficiencia: 82 },
                      { month: "Mar", eficiencia: 87 },
                      { month: "Abr", eficiencia: 90 },
                      { month: "May", eficiencia: 88 },
                      { month: "Jun", eficiencia: 84 },
                    ]}
                    lines={[{ dataKey: "eficiencia", color: "#003366", name: "Eficiencia" }]}
                    nameKey="month"
                    xAxisLabel="Mes"
                    yAxisLabel="Eficiencia (%)"
                    formatter={(value) => `${value}%`}
                    domain={[75, 100]}
                    height={300}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tiempo de Respuesta a Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChartCustom
                  data={[
                    { equipo: "Biseladora", tiempo: 24 },
                    { equipo: "Bloqueadora", tiempo: 36 },
                    { equipo: "Trazadora", tiempo: 12 },
                    { equipo: "Horno", tiempo: 48 },
                    { equipo: "Pulidora", tiempo: 18 },
                  ]}
                  dataKey="tiempo"
                  nameKey="equipo"
                  xAxisLabel="Equipo"
                  yAxisLabel="Horas"
                  formatter={(value) => `${value}h`}
                  height={300}
                  layout="vertical"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
