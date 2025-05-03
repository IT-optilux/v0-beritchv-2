import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Machine, InventoryItem, Maintenance, Report } from "@/types"

// Función para formatear fechas
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Función para formatear moneda
const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) return "N/A"
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

// Clase base para generación de PDF
export class PdfGenerator {
  protected doc: jsPDF
  protected title: string
  protected subtitle: string
  protected pageWidth: number
  protected pageHeight: number
  protected margin: number
  protected currentY: number
  protected logoUrl: string | null

  constructor(
    title: string,
    subtitle = "",
    orientation: "portrait" | "landscape" = "portrait",
    logoUrl: string | null = null,
  ) {
    this.doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    })
    this.title = title
    this.subtitle = subtitle
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 15
    this.currentY = this.margin
    this.logoUrl = logoUrl
  }

  protected async addHeader() {
    // Add logo if provided
    if (this.logoUrl) {
      try {
        const img = new Image()
        img.src = this.logoUrl
        await new Promise((resolve) => {
          img.onload = resolve
        })
        this.doc.addImage(img, "PNG", this.margin, this.currentY, 40, 15)
        this.currentY += 20
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    // Add title
    this.doc.setFontSize(18)
    this.doc.setTextColor(0, 51, 102) // Optilab blue
    this.doc.text(this.title, this.pageWidth / 2, this.currentY, { align: "center" })
    this.currentY += 10

    // Add subtitle if provided
    if (this.subtitle) {
      this.doc.setFontSize(12)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(this.subtitle, this.pageWidth / 2, this.currentY, { align: "center" })
      this.currentY += 10
    }

    // Add date
    this.doc.setFontSize(10)
    this.doc.setTextColor(100, 100, 100)
    const today = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    this.doc.text(`Fecha de generación: ${today}`, this.pageWidth - this.margin, this.currentY, { align: "right" })
    this.currentY += 15
  }

  protected addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(150, 150, 150)
      this.doc.text(`Beritch by Optilab - Página ${i} de ${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, {
        align: "center",
      })
    }
  }

  public async generate(): Promise<Blob> {
    await this.addHeader()
    this.addFooter()
    return this.doc.output("blob")
  }

  public async download(filename: string): Promise<void> {
    await this.addHeader()
    this.addFooter()
    this.doc.save(filename)
  }
}

// Generador de PDF para máquinas
export class MachinePdfGenerator extends PdfGenerator {
  private machine: Machine
  private maintenances: Maintenance[]
  private reports: Report[]

  constructor(machine: Machine, maintenances: Maintenance[] = [], reports: Report[] = []) {
    super(`Ficha Técnica: ${machine.name}`, `Modelo: ${machine.model} - Serie: ${machine.serialNumber}`)
    this.machine = machine
    this.maintenances = maintenances
    this.reports = reports
  }

  public async generate(): Promise<Blob> {
    await this.addHeader()

    // Machine details
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text("Información General", this.margin, this.currentY)
    this.currentY += 8

    const details = [
      ["Fabricante", this.machine.manufacturer || "No especificado"],
      ["Estado", this.machine.status],
      ["Ubicación", this.machine.location || "No especificada"],
      ["Fecha de Compra", formatDate(this.machine.purchaseDate)],
      ["Último Mantenimiento", formatDate(this.machine.lastMaintenance)],
      ["Próximo Mantenimiento", formatDate(this.machine.nextMaintenance)],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Atributo", "Valor"]],
      body: details,
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15

    // Description
    if (this.machine.description) {
      this.doc.setFontSize(14)
      this.doc.setTextColor(0, 51, 102)
      this.doc.text("Descripción", this.margin, this.currentY)
      this.currentY += 8

      this.doc.setFontSize(10)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(this.machine.description, this.margin, this.currentY, {
        maxWidth: this.pageWidth - this.margin * 2,
      })
      this.currentY += 15
    }

    // Maintenance history
    if (this.maintenances.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setTextColor(0, 51, 102)
      this.doc.text("Historial de Mantenimientos", this.margin, this.currentY)
      this.currentY += 8

      const maintenanceData = this.maintenances.map((m) => [
        formatDate(m.startDate),
        m.maintenanceType,
        m.status,
        m.technician,
        formatCurrency(m.cost),
      ])

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Fecha", "Tipo", "Estado", "Técnico", "Costo"]],
        body: maintenanceData,
        theme: "grid",
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
        },
        margin: { left: this.margin, right: this.margin },
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15
    }

    // Reports
    if (this.reports.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setTextColor(0, 51, 102)
      this.doc.text("Reportes Asociados", this.margin, this.currentY)
      this.currentY += 8

      const reportData = this.reports.map((r) => [
        formatDate(r.reportDate),
        r.reportType,
        r.status,
        r.priority,
        r.reportedBy,
      ])

      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Fecha", "Tipo", "Estado", "Prioridad", "Reportado por"]],
        body: reportData,
        theme: "grid",
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
        },
        margin: { left: this.margin, right: this.margin },
      })
    }

    this.addFooter()
    return this.doc.output("blob")
  }
}

// Generador de PDF para inventario
export class InventoryPdfGenerator extends PdfGenerator {
  private items: InventoryItem[]

  constructor(items: InventoryItem[], title = "Reporte de Inventario") {
    super(title, `Total de ítems: ${items.length}`, "landscape")
    this.items = items
  }

  public async generate(): Promise<Blob> {
    await this.addHeader()

    // Inventory summary
    const inStock = this.items.filter((i) => i.status === "En stock").length
    const lowStock = this.items.filter((i) => i.status === "Bajo stock").length
    const outOfStock = this.items.filter((i) => i.status === "Sin stock").length

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(
      `En stock: ${inStock} | Bajo stock: ${lowStock} | Sin stock: ${outOfStock}`,
      this.margin,
      this.currentY,
    )
    this.currentY += 10

    // Inventory table
    const itemData = this.items.map((item) => [
      item.name,
      item.category,
      item.tipo_de_item || "No especificado",
      `${item.quantity} / ${item.minQuantity}`,
      item.location,
      item.status,
      formatCurrency(item.unitPrice),
      item.supplier || "No especificado",
      formatDate(item.lastUpdated),
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Nombre", "Categoría", "Tipo", "Cantidad", "Ubicación", "Estado", "Precio", "Proveedor", "Actualizado"]],
      body: itemData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 8,
      },
    })

    this.addFooter()
    return this.doc.output("blob")
  }
}

// Generador de PDF para mantenimientos
export class MaintenancePdfGenerator extends PdfGenerator {
  private maintenance: Maintenance

  constructor(maintenance: Maintenance) {
    super(
      `Orden de Mantenimiento: ${maintenance.machineName}`,
      `Tipo: ${maintenance.maintenanceType} - Fecha: ${formatDate(maintenance.startDate)}`,
    )
    this.maintenance = maintenance
  }

  public async generate(): Promise<Blob> {
    await this.addHeader()

    // Maintenance details
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text("Detalles del Mantenimiento", this.margin, this.currentY)
    this.currentY += 8

    const details = [
      ["Equipo", this.maintenance.machineName],
      ["Tipo", this.maintenance.maintenanceType],
      ["Estado", this.maintenance.status],
      ["Fecha de Inicio", formatDate(this.maintenance.startDate)],
      ["Fecha de Finalización", formatDate(this.maintenance.endDate)],
      ["Técnico", this.maintenance.technician],
      ["Costo", formatCurrency(this.maintenance.cost)],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Atributo", "Valor"]],
      body: details,
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15

    // Description
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text("Descripción", this.margin, this.currentY)
    this.currentY += 8

    this.doc.setFontSize(10)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(this.maintenance.description, this.margin, this.currentY, {
      maxWidth: this.pageWidth - this.margin * 2,
    })
    this.currentY += 15

    // Observations
    if (this.maintenance.observations) {
      this.doc.setFontSize(14)
      this.doc.setTextColor(0, 51, 102)
      this.doc.text("Observaciones", this.margin, this.currentY)
      this.currentY += 8

      this.doc.setFontSize(10)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(this.maintenance.observations, this.margin, this.currentY, {
        maxWidth: this.pageWidth - this.margin * 2,
      })
      this.currentY += 15
    }

    // Signature fields
    this.currentY = Math.max(this.currentY, this.pageHeight - 70)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)

    // Technician signature
    this.doc.line(this.margin, this.currentY, this.pageWidth / 2 - 20, this.currentY)
    this.doc.text("Firma del Técnico", this.margin, this.currentY + 5)

    // Supervisor signature
    this.doc.line(this.pageWidth / 2 + 20, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.doc.text("Firma del Supervisor", this.pageWidth / 2 + 20, this.currentY + 5)

    this.addFooter()
    return this.doc.output("blob")
  }
}

// Generador de PDF para reportes
export class ReportPdfGenerator extends PdfGenerator {
  private report: Report

  constructor(report: Report) {
    super(`Reporte: ${report.machineName}`, `Tipo: ${report.reportType} - Prioridad: ${report.priority}`)
    this.report = report
  }

  public async generate(): Promise<Blob> {
    await this.addHeader()

    // Report details
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text("Detalles del Reporte", this.margin, this.currentY)
    this.currentY += 8

    const details = [
      ["Equipo", this.report.machineName],
      ["Tipo", this.report.reportType],
      ["Estado", this.report.status],
      ["Prioridad", this.report.priority],
      ["Fecha de Reporte", formatDate(this.report.reportDate)],
      ["Reportado por", this.report.reportedBy],
      ["Asignado a", this.report.assignedTo || "No asignado"],
      ["Fecha de Finalización", formatDate(this.report.completedDate)],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Atributo", "Valor"]],
      body: details,
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15

    // Description
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text("Descripción", this.margin, this.currentY)
    this.currentY += 8

    this.doc.setFontSize(10)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(this.report.description, this.margin, this.currentY, {
      maxWidth: this.pageWidth - this.margin * 2,
    })
    this.currentY += 15

    // Resolution
    if (this.report.resolution) {
      this.doc.setFontSize(14)
      this.doc.setTextColor(0, 51, 102)
      this.doc.text("Resolución", this.margin, this.currentY)
      this.currentY += 8

      this.doc.setFontSize(10)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(this.report.resolution, this.margin, this.currentY, {
        maxWidth: this.pageWidth - this.margin * 2,
      })
      this.currentY += 15
    }

    // Signature fields
    this.currentY = Math.max(this.currentY, this.pageHeight - 70)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)

    // Reporter signature
    this.doc.line(this.margin, this.currentY, this.pageWidth / 2 - 20, this.currentY)
    this.doc.text("Firma del Reportante", this.margin, this.currentY + 5)

    // Technician signature
    this.doc.line(this.pageWidth / 2 + 20, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.doc.text("Firma del Técnico", this.pageWidth / 2 + 20, this.currentY + 5)

    this.addFooter()
    return this.doc.output("blob")
  }
}
