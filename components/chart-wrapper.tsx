"use client"

import type { ReactNode } from "react"
import { ResponsiveContainer } from "recharts"

interface ChartWrapperProps {
  children: ReactNode
  height?: number | string
  className?: string
}

export function ChartWrapper({ children, height = 300, className = "" }: ChartWrapperProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        minHeight: "300px", // Aseguramos una altura mínima
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
