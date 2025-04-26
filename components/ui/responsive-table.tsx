"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ResponsiveTableProps {
  headers: string[]
  data: any[]
  keyField: string
  renderCell: (item: any, column: string, index: number) => React.ReactNode
  className?: string
  emptyMessage?: string
}

export function ResponsiveTable({
  headers,
  data,
  keyField,
  renderCell,
  className,
  emptyMessage = "No hay datos disponibles.",
}: ResponsiveTableProps) {
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow key={item[keyField] || rowIndex}>
                {headers.map((header, colIndex) => (
                  <TableCell key={colIndex}>{renderCell(item, header, colIndex)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
