"use client"

import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { ChartWrapper } from "./chart-wrapper"

// Colores para los gráficos (usando los colores corporativos como base)
const COLORS = [
  "#003366", // Azul oscuro de la empresa (primario)
  "#00bfff", // Celeste de la empresa (secundario)
  "#0066cc", // Variación del azul
  "#0099cc", // Variación del celeste
  "#003399", // Variación del azul oscuro
  "#0088cc", // Variación del celeste
  "#004488", // Variación del azul oscuro
  "#00aadd", // Variación del celeste
]

interface PieChartCustomProps {
  data: any[]
  dataKey: string
  nameKey?: string
  height?: number | string
  formatter?: (value: number) => string
  colorOffset?: number
  showLabel?: boolean
  showLegend?: boolean
  emptyMessage?: string
}

export function PieChartCustom({
  data,
  dataKey,
  nameKey = "name",
  height = 300,
  formatter = (value) => `${value}`,
  colorOffset = 0,
  showLabel = true,
  showLegend = true,
  emptyMessage = "No hay datos disponibles para mostrar.",
}: PieChartCustomProps) {
  // Verificar si hay datos
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-md border border-gray-200"
        style={{ height: typeof height === "number" ? `${height}px` : height, minHeight: "300px" }}
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  // Verificar si todos los valores son cero
  const allZero = data.every((item) => item[dataKey] === 0)
  if (allZero) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-md border border-gray-200"
        style={{ height: typeof height === "number" ? `${height}px` : height, minHeight: "300px" }}
      >
        <p className="text-gray-500">Todos los valores son cero. No hay datos para mostrar.</p>
      </div>
    )
  }

  return (
    <ChartWrapper height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={
            showLabel
              ? ({ name, percent }) => {
                  const percentValue = (percent * 100).toFixed(0)
                  return percentValue > 5 ? `${name}: ${percentValue}%` : ""
                }
              : undefined
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[(index + colorOffset) % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatter(Number(value))}
          labelFormatter={(label) => `${label}`}
          contentStyle={{ fontSize: "12px" }}
        />
        {showLegend && <Legend />}
      </PieChart>
    </ChartWrapper>
  )
}
