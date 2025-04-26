"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { Report } from "@/types"
import { getReports, deleteReport } from "@/app/actions/reports"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ReportForm } from "@/components/reports/report-form"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getReports()
        setReports(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los reportes.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [toast])

  const handleEdit = (report: Report) => {
    setSelectedReport(report)
    setIsEditModalOpen(true)
  }

  const handleDelete = (report: Report) => {
    setSelectedReport(report)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedReport) return

    setIsDeleting(true)
    try {
      const result = await deleteReport(selectedReport.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setReports(reports.filter((r) => r.id !== selectedReport.id))
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al eliminar el reporte.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedReport(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getReports()
      setReports(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Reportes</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Reporte
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Reportes</CardTitle>
          <CardDescription>Gestione todos los reportes de fallas, mantenimientos y calibraciones</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No hay reportes registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.machineName}</TableCell>
                      <TableCell>{report.reportType}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                      <TableCell>{report.reportedBy}</TableCell>
                      <TableCell>{new Date(report.reportDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            report.status === "Completado"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : report.status === "En proceso"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-red-500 bg-red-50 text-red-700"
                          }
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            report.priority === "Baja"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : report.priority === "Media"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-red-500 bg-red-50 text-red-700"
                          }
                        >
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(report)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-optilab-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(report)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-optilab-blue hover:bg-gray-100"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar reporte */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Nuevo Reporte" size="lg">
        <ReportForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar reporte */}
      {selectedReport && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedReport(null)
          }}
          title="Editar Reporte"
          size="lg"
        >
          <ReportForm
            report={selectedReport}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedReport(null)
            }}
            onSuccess={refreshData}
          />
        </Modal>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedReport(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Reporte"
        message={`¿Está seguro que desea eliminar este reporte? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}
