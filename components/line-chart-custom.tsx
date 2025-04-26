"use client"

import { Line, LineChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { ChartWrapper } from "./chart-wrapper"

interface LineChartCustomProps {
  data: any[]
  lines: {
    dataKey: string
    color: string
    name?: string
  }[]
  nameKey?: string
  xAxisLabel?: string
  yAxisLabel?: string
  height?: number | string
  showGrid?: boolean
  formatter?: (value: number) => string
  domain?: [number, number]
  emptyMessage?: string
}

export function LineChartCustom({
  data,
  lines,
  nameKey = "name",
  xAxisLabel,
  yAxisLabel,
  height = 300,
  showGrid = true,
  formatter = (value) => `${value}`,
  domain,
  emptyMessage = "No hay datos disponibles para mostrar.",
}: LineChartCustomProps) {
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
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          dataKey={nameKey}
          tick={{
            fontSize: 12,
            angle: data.length > 6 ? -45 : 0,
            textAnchor: data.length > 6 ? "end" : "middle",
          }}
          height={data.length > 6 ? 60 : 30}
          tickFormatter={(value) =>
            typeof value === "string" && value.length > 10 ? `${value.substring(0, 10)}...` : value
          }
          label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
        />
        <YAxis
          domain={domain}
          tick={{ fontSize: 12 }}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
        />
        <Tooltip
          formatter={(value) => formatter(Number(value))}
          labelFormatter={(label) => `Período: ${label}`}
          contentStyle={{ fontSize: "12px" }}
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name || line.dataKey}
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ChartWrapper>
  )
}
