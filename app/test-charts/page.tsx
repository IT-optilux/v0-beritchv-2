"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"
import { PieChartCustom } from "@/components/pie-chart-custom"
import { formatCurrency, formatPercent } from "@/lib/formatters"

// Datos de ejemplo para los gráficos
const barData = [
  { name: "Enero", value: 400 },
  { name: "Febrero", value: 300 },
  { name: "Marzo", value: 600 },
  { name: "Abril", value: 200 },
  { name: "Mayo", value: 700 },
  { name: "Junio", value: 500 },
]

const lineData = [
  { name: "Enero", valor1: 400, valor2: 240 },
  { name: "Febrero", valor1: 300, valor2: 139 },
  { name: "Marzo", valor1: 600, valor2: 380 },
  { name: "Abril", valor1: 200, valor2: 390 },
  { name: "Mayo", valor1: 700, valor2: 430 },
  { name: "Junio", valor1: 500, valor2: 320 },
]

const pieData = [
  { name: "Grupo A", value: 400 },
  { name: "Grupo B", value: 300 },
  { name: "Grupo C", value: 300 },
  { name: "Grupo D", value: 200 },
]

// Datos vacíos para probar el manejo de casos sin datos
const emptyData: any[] = []

export default function TestChartsPage() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Prueba de Gráficos</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Barras</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCustom
              data={barData}
              dataKey="value"
              xAxisLabel="Mes"
              yAxisLabel="Valor"
              formatter={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Barras (Sin Datos)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCustom
              data={emptyData}
              dataKey="value"
              xAxisLabel="Mes"
              yAxisLabel="Valor"
              formatter={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Líneas</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartCustom
              data={lineData}
              lines={[
                { dataKey: "valor1", color: "#003366", name: "Serie 1" },
                { dataKey: "valor2", color: "#00bfff", name: "Serie 2" },
              ]}
              xAxisLabel="Mes"
              yAxisLabel="Valor"
              formatter={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Líneas (Sin Datos)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartCustom
              data={emptyData}
              lines={[
                { dataKey: "valor1", color: "#003366", name: "Serie 1" },
                { dataKey: "valor2", color: "#00bfff", name: "Serie 2" },
              ]}
              xAxisLabel="Mes"
              yAxisLabel="Valor"
              formatter={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Pastel</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartCustom data={pieData} dataKey="value" formatter={formatPercent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Pastel (Sin Datos)</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartCustom data={emptyData} dataKey="value" formatter={formatPercent} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
