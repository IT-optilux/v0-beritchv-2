"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, DollarSign, BarChart3, PieChartIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  getCostoPorEquipo,
  getGastoAcumulado,
  getComparativoPreventivosCorrectivos,
} from "@/app/actions/maintenance-reports"
import { useToast } from "@/hooks/use-toast"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"
import { PieChartCustom } from "@/components/pie-chart-custom"

// Importar los formateadores
import { formatCurrency } from "@/lib/formatters"

export default function MaintenanceDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [costoPorEquipo, setCostoPorEquipo] = useState<any[]>([])
  const [gastoAcumulado, setGastoAcumulado] = useState<any[]>([])
  const [comparativo, setComparativo] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costosEquipo, gastos, comparativoData] = await Promise.all([
          getCostoPorEquipo(),
          getGastoAcumulado(),
          getComparativoPreventivosCorrectivos(),
        ])

        setCostoPorEquipo(costosEquipo)
        setGastoAcumulado(gastos)
        setComparativo(comparativoData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del panel de control.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Preparar datos para el gráfico de distribución de costos
  const distribucionCostos = comparativo
    ? [
        { name: "Preventivos", value: comparativo.resumen.preventivos.costoTotal },
        { name: "Correctivos", value: comparativo.resumen.correctivos.costoTotal },
        { name: "Calibraciones", value: comparativo.resumen.calibraciones.costoTotal },
      ]
    : []

  // Preparar datos para el gráfico de tendencia mensual
  const tendenciaMensual = comparativo ? comparativo.tendenciaMensual : []

  // Preparar datos para el gráfico de costo por equipo (top 5)
  const topEquipos = [...costoPorEquipo].sort((a, b) => b.costoTotal - a.costoTotal).slice(0, 5)

  // Preparar datos para el gráfico de gasto por área
  const gastoPorArea = gastoAcumulado.map((area) => ({
    name: area.area,
    value: area.costoTotal,
  }))

  // Formateador para valores monetarios
  // const formatCurrency = (value: number) =>
  //   new Intl.NumberFormat("es-ES", {
  //     style: "currency",
  //     currency: "USD",
  //   }).format(value)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-optilab-blue">Panel de Control de Mantenimiento</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mantenimientos Totales</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comparativo
                ? comparativo.resumen.preventivos.cantidad +
                  comparativo.resumen.correctivos.cantidad +
                  comparativo.resumen.calibraciones.cantidad
                : 0}
            </div>
            <p className="text-xs text-gray-500">
              {comparativo
                ? `${comparativo.resumen.preventivos.cantidad} preventivos, ${comparativo.resumen.correctivos.cantidad} correctivos`
                : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comparativo
                ? formatCurrency(
                    comparativo.resumen.preventivos.costoTotal +
                      comparativo.resumen.correctivos.costoTotal +
                      comparativo.resumen.calibraciones.costoTotal,
                  )
                : "0,00 €"}
            </div>
            <p className="text-xs text-gray-500">Mantenimientos + Repuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Preventivos vs Correctivos</CardTitle>
            <PieChartIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comparativo && comparativo.resumen.preventivos.cantidad + comparativo.resumen.correctivos.cantidad > 0
                ? `${Math.round((comparativo.resumen.preventivos.cantidad / (comparativo.resumen.preventivos.cantidad + comparativo.resumen.correctivos.cantidad)) * 100)}%`
                : "0%"}
            </div>
            <p className="text-xs text-gray-500">Proporción de mantenimientos preventivos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Áreas con Mantenimiento</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastoAcumulado.length}</div>
            <p className="text-xs text-gray-500">
              {gastoAcumulado.length > 0 ? `${gastoAcumulado[0].area} con mayor gasto` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Costos</CardTitle>
            <CardDescription>Por tipo de mantenimiento</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChartCustom data={distribucionCostos} dataKey="value" formatter={formatCurrency} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Preventivos vs Correctivos</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChartCustom
              data={tendenciaMensual}
              lines={[
                { dataKey: "preventivos", color: "#003366", name: "Preventivos" },
                { dataKey: "correctivos", color: "#ff3333", name: "Correctivos" },
              ]}
              nameKey="mes"
              xAxisLabel="Mes"
              yAxisLabel="Cantidad"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Equipos por Costo</CardTitle>
            <CardDescription>Equipos con mayor gasto en mantenimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEquipos.map((equipo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{equipo.equipoNombre}</span>
                    <span className="text-sm font-medium">{formatCurrency(equipo.costoTotal)}</span>
                  </div>
                  <Progress
                    value={equipo.costoTotal}
                    max={topEquipos[0].costoTotal}
                    className="h-2"
                    indicatorClassName={`bg-optilab-blue`}
                  />
                  <p className="text-xs text-gray-500">
                    {equipo.cantidadMantenimientos} mantenimientos | {equipo.ubicacion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasto por Área</CardTitle>
            <CardDescription>Distribución de costos por ubicación</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BarChartCustom
              data={gastoPorArea}
              dataKey="value"
              nameKey="name"
              xAxisLabel="Área"
              yAxisLabel="Costo"
              formatter={formatCurrency}
              height={300}
              colorIndex={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
