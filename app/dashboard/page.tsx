import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Clock, PenToolIcon as Tool } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-optilab-blue">Panel de Control</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipos Totales</CardTitle>
            <Tool className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-gray-500">12 activos, 12 inactivos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reportes Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-gray-500">3 urgentes, 4 normales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mantenimientos Programados</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-gray-500">Próximos 7 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia Promedio</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-gray-500">+2% desde el mes pasado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas actualizaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "Hoy, 10:30 AM", action: "Mantenimiento completado en Biseladora #2" },
                { time: "Ayer, 3:45 PM", action: "Reporte de falla en Bloqueadora #1" },
                { time: "Ayer, 11:20 AM", action: "Actualización de inventario: +50 moldes" },
                { time: "15 Abr, 9:15 AM", action: "Calibración programada para Trazadora #3" },
                { time: "14 Abr, 2:30 PM", action: "Reporte mensual generado" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-optilab-light/20 text-optilab-light">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Equipos con Alertas</CardTitle>
            <CardDescription>Máquinas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Biseladora #3", status: "Mantenimiento pendiente", severity: "low" },
                { name: "Bloqueadora #1", status: "Falla reportada", severity: "high" },
                { name: "Trazadora #2", status: "Calibración vencida", severity: "medium" },
                { name: "Horno #1", status: "Rendimiento bajo", severity: "medium" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.severity === "high"
                          ? "bg-red-500"
                          : item.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.status}</p>
                    </div>
                  </div>
                  <button className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
