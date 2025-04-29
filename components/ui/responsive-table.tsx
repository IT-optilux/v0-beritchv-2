"use client"

import React, { useState, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

interface Column {
  header: string
  accessor: string
  cell?: (row: any) => React.ReactNode
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  className?: string
  onRowClick?: (row: any) => void
  isLoading?: boolean
}

export function ResponsiveTable({ columns, data, className, onRowClick, isLoading = false }: ResponsiveTableProps) {
  const [isMobile, setIsMobile] = useState(false)
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Virtualización para mejorar el rendimiento con grandes conjuntos de datos
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // altura estimada de cada fila
    overscan: 5,
  })

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="w-full p-4 text-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-4 text-center">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className={cn("w-full overflow-auto max-h-[600px]", className)}>
      {isMobile ? (
        <div
          className="space-y-4"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                className={cn("p-4 border rounded-lg shadow-sm", onRowClick && "cursor-pointer hover:bg-gray-50")}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="row"
              >
                {columns.map((column) => (
                  <div key={column.accessor} className="mb-2">
                    <span className="font-medium">{column.header}: </span>
                    <span>{column.cell ? column.cell(row) : row[column.accessor] || "N/A"}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className="bg-white divide-y divide-gray-200"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index]
              return (
                <tr
                  key={virtualRow.index}
                  className={cn(onRowClick && "cursor-pointer hover:bg-gray-50")}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {columns.map((column) => (
                    <td key={column.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {column.cell ? column.cell(row) : row[column.accessor] || "N/A"}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
