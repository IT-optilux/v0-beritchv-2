"use client"

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, Cell } from "recharts"
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

interface BarChartCustomProps {
  data: any[]
  dataKey: string
  nameKey?: string
  xAxisLabel?: string
  yAxisLabel?: string
  title?: string
  height?: number | string
  layout?: "horizontal" | "vertical"
  showGrid?: boolean
  formatter?: (value: number) => string
  colorIndex?: number
  emptyMessage?: string
}

export function BarChartCustom({
  data,
  dataKey,
  nameKey = "name",
  xAxisLabel,
  yAxisLabel,
  height = 300,
  layout = "horizontal",
  showGrid = true,
  formatter = (value) => `${value}`,
  colorIndex = 0,
  emptyMessage = "No hay datos disponibles para mostrar.",
}: BarChartCustomProps) {
  const isVertical = layout === "vertical"

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

  return (
    <ChartWrapper height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}

        {isVertical ? (
          <>
            <XAxis
              type="number"
              label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
            />
            <YAxis
              dataKey={nameKey}
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                typeof value === "string" && value.length > 15 ? `${value.substring(0, 15)}...` : value
              }
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={nameKey}
              tick={{
                fontSize: 12,
                angle: data.length > 5 ? -45 : 0,
                textAnchor: data.length > 5 ? "end" : "middle",
              }}
              height={data.length > 5 ? 70 : 30}
              tickFormatter={(value) =>
                typeof value === "string" && value.length > 10 ? `${value.substring(0, 10)}...` : value
              }
              label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
            />
            <YAxis
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
              tick={{ fontSize: 12 }}
            />
          </>
        )}

        <Tooltip
          formatter={(value) => formatter(Number(value))}
          labelFormatter={(label) => `${isVertical ? "Ítem" : "Categoría"}: ${label}`}
          contentStyle={{ fontSize: "12px" }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={COLORS[colorIndex % COLORS.length]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[(index + colorIndex) % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  )
}
