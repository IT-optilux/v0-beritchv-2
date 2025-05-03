"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import {
  MachinePdfGenerator,
  InventoryPdfGenerator,
  MaintenancePdfGenerator,
  ReportPdfGenerator,
} from "@/lib/pdf-service"
import type { Machine, InventoryItem, Maintenance, Report } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface ExportPdfButtonProps {
  type: "machine" | "inventory" | "maintenance" | "report"
  data: Machine | InventoryItem[] | Maintenance | Report
  additionalData?: {
    maintenances?: Maintenance[]
    reports?: Report[]
  }
  filename?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ExportPdfButton({
  type,
  data,
  additionalData,
  filename,
  className,
  variant = "outline",
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      let generator
      let defaultFilename = ""

      switch (type) {
        case "machine":
          const machine = data as Machine
          generator = new MachinePdfGenerator(
            machine,
            additionalData?.maintenances || [],
            additionalData?.reports || [],
          )
          defaultFilename = `equipo_${machine.name.replace(/\s+/g, "_").toLowerCase()}.pdf`
          break

        case "inventory":
          const items = data as InventoryItem[]
          generator = new InventoryPdfGenerator(items)
          defaultFilename = "inventario.pdf"
          break

        case "maintenance":
          const maintenance = data as Maintenance
          generator = new MaintenancePdfGenerator(maintenance)
          defaultFilename = `mantenimiento_${maintenance.id}.pdf`
          break

        case "report":
          const report = data as Report
          generator = new ReportPdfGenerator(report)
          defaultFilename = `reporte_${report.id}.pdf`
          break

        default:
          throw new Error("Tipo de exportación no válido")
      }

      await generator.download(filename || defaultFilename)

      toast({
        title: "Éxito",
        description: "Documento PDF generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el documento PDF",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant={variant} onClick={handleExport} disabled={isExporting} className={className}>
      <FileDown className="mr-2 h-4 w-4" />
      {isExporting ? "Generando..." : "Exportar PDF"}
    </Button>
  )
}
