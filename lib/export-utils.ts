import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"
import { formatCurrency, formatDate } from "./formatters"

// Función para exportar datos a PDF
export function exportToPDF(
  title: string,
  headers: string[],
  data: any[],
  filename = "reporte.pdf",
  orientation: "portrait" | "landscape" = "portrait",
) {
  // Crear un nuevo documento PDF
  const doc = new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: "a4",
  })

  // Añadir título
  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 14, 30)

  // Preparar los datos para la tabla
  const tableData = data.map((row) => {
    return headers.map((header) => {
      const value = row[header.toLowerCase().replace(/ /g, "_")]
      // Formatear valores numéricos si es necesario
      if (typeof value === "number") {
        if (header.toLowerCase().includes("costo") || header.toLowerCase().includes("precio")) {
          return formatCurrency(value)
        }
        return value.toString()
      }
      return value || ""
    })
  })

  // Añadir la tabla
  ;(doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: 40,
    theme: "grid",
    headStyles: {
      fillColor: [0, 51, 102], // Color azul oscuro de la empresa
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 40 },
  })

  // Añadir pie de página
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(
      `Beritch by Optilab - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    )
  }

  // Guardar el PDF
  doc.save(filename)
}

// Función para exportar datos a Excel
export function exportToExcel(title: string, headers: string[], data: any[], filename = "reporte.xlsx") {
  // Preparar los datos para Excel
  const excelData = [
    // Primera fila: título
    [title],
    // Segunda fila: fecha de generación
    [`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`],
    // Tercera fila: vacía
    [],
    // Cuarta fila: encabezados
    headers,
    // Datos
    ...data.map((row) => {
      return headers.map((header) => {
        return row[header.toLowerCase().replace(/ /g, "_")] || ""
      })
    }),
  ]

  // Crear libro de trabajo
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Aplicar estilos (limitado en xlsx)
  // Combinar celdas para el título
  if (!ws["!merges"]) ws["!merges"] = []
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } })
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } })

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, "Reporte")

  // Guardar el archivo
  XLSX.writeFile(wb, filename)
}

// Función para preparar datos de tabla para exportación
export function prepareTableDataForExport(
  tableData: any[],
  columnMapping: { [key: string]: string },
): { headers: string[]; data: any[] } {
  const headers = Object.values(columnMapping)
  const keys = Object.keys(columnMapping)

  const data = tableData.map((row) => {
    const newRow: { [key: string]: any } = {}
    keys.forEach((key, index) => {
      newRow[headers[index]] = row[key]
    })
    return newRow
  })

  return { headers, data }
}
