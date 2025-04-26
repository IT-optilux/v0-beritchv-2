"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportToPDF, exportToExcel } from "@/lib/export-utils"

interface ExportButtonsProps {
  title: string
  headers: string[]
  data: any[]
  filename?: string
  orientation?: "portrait" | "landscape"
  disabled?: boolean
}

export function ExportButtons({
  title,
  headers,
  data,
  filename = "reporte",
  orientation = "portrait",
  disabled = false,
}: ExportButtonsProps) {
  const handleExportPDF = () => {
    exportToPDF(title, headers, data, `${filename}.pdf`, orientation)
  }

  const handleExportExcel = () => {
    exportToExcel(title, headers, data, `${filename}.xlsx`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Descargar reporte
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar a PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar a Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
