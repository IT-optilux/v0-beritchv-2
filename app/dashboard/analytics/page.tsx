"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"

// Datos de ejemplo para los gráficos
const monthlyData = [
  { month: "Ene", mantenimientos: 12, fallas: 5, eficiencia: 85 },
  { month: "Feb", mantenimientos: 15, fallas: 8, eficiencia: 82 },
  { month: "Mar", mantenimientos: 10, fallas: 6, eficiencia: 87 },
  { month: "Abr", mantenimientos: 14, fallas: 4, eficiencia: 90 },
  { month: "May", mantenimientos: 18, fallas: 7, eficiencia: 88 },
  { month: "Jun", mantenimientos: 16, fallas: 9, eficiencia: 84 },
]

const equipmentData = [
  { name: "Biseladora", mantenimientos: 25, fallas: 8, disponibilidad: 92 },
  { name: "Bloqueadora", mantenimientos: 18, fallas: 12, disponibilidad: 85 },
  { name: "Trazadora", mantenimientos: 22, fallas: 5, disponibilidad: 94 },
  { name: "Horno", mantenimientos: 15, fallas: 10, disponibilidad: 88 },
  { name: "Pulidora", mantenimientos: 20, fallas: 7, disponibilidad: 90 },
]

const inventoryData = [
  { name: "Moldes", actual: 230, minimo: 100 },
  { name: "Bloques", actual: 45, minimo: 40 },
  { name: "Consumibles", actual: 120, minimo: 50 },
  { name: "Químicos", actual: 35, minimo: 30 },
  { name: "Repuestos", actual: 15, minimo: 25 },
]

export default function AnalyticsPage() {
  // Formateador para valores de eficiencia
  const formatPercent = (value: number) => `${value}%`

  // Formateador para valores enteros
  const formatInteger = (value: number) => `${value}`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-optilab-blue">Informes y Análisis</h1>

      <Tabs defaultValue="monthly">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Tendencias Mensuales</TabsTrigger>
          <TabsTrigger value="equipment">Análisis por Equipo</TabsTrigger>
          <TabsTrigger value="inventory">Estado de Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
              <CardDescription>Análisis de mantenimientos y fallas en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData && monthlyData.length > 0 ? (
                <BarChartCustom
                  data={monthlyData}
                  dataKey="mantenimientos"
                  nameKey="month"
                  xAxisLabel="Mes"
                  yAxisLabel="Cantidad"
                  formatter={formatInteger}
                  height={300}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}

              <div className="mt-6">
                {monthlyData && monthlyData.length > 0 ? (
                  <BarChartCustom
                    data={monthlyData}
                    dataKey="fallas"
                    nameKey="month"
                    xAxisLabel="Mes"
                    yAxisLabel="Cantidad"
                    formatter={formatInteger}
                    height={300}
                    colorIndex={1}
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eficiencia Operativa</CardTitle>
              <CardDescription>Porcentaje de eficiencia operativa mensual</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData && monthlyData.length > 0 ? (
                <LineChartCustom
                  data={monthlyData}
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
          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos y Fallas por Equipo</CardTitle>
              <CardDescription>Comparativa de mantenimientos y fallas por tipo de equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {equipmentData && equipmentData.length > 0 ? (
                <BarChartCustom
                  data={equipmentData}
                  dataKey="mantenimientos"
                  nameKey="name"
                  xAxisLabel="Equipo"
                  yAxisLabel="Cantidad"
                  formatter={formatInteger}
                  height={300}
                  layout="vertical"
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                </div>
              )}

              <div className="mt-6">
                {equipmentData && equipmentData.length > 0 ? (
                  <BarChartCustom
                    data={equipmentData}
                    dataKey="fallas"
                    nameKey="name"
                    xAxisLabel="Equipo"
                    yAxisLabel="Cantidad"
                    formatter={formatInteger}
                    height={300}
                    layout="vertical"
                    colorIndex={1}
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilidad por Equipo</CardTitle>
              <CardDescription>Porcentaje de disponibilidad por tipo de equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {equipmentData && equipmentData.length > 0 ? (
                <BarChartCustom
                  data={equipmentData}
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
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual del Inventario</CardTitle>
              <CardDescription>Comparativa entre niveles actuales y mínimos requeridos</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-6">
              {inventoryData.map((item, index) => (
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
