"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  MachinePdfGenerator,
  InventoryPdfGenerator,
  MaintenancePdfGenerator,
  ReportPdfGenerator,
} from "@/lib/pdf-service"
import type { Machine, InventoryItem, Maintenance, Report } from "@/types"

interface GenerateReportButtonProps {
  type: "machine" | "inventory" | "maintenance" | "report"
  data: Machine | InventoryItem[] | Maintenance | Report
  additionalData?: {
    maintenances?: Maintenance[]
    reports?: Report[]
  }
  filename?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function GenerateReportButton({
  type,
  data,
  additionalData,
  filename,
  className,
  variant = "outline",
  size = "default",
  children,
}: GenerateReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

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
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el documento PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleGenerate} disabled={isGenerating} className={className}>
      {isGenerating ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Generando...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          {children || "Generar PDF"}
        </>
      )}
    </Button>
  )
}
