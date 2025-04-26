"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit } from "lucide-react"
import type { Report } from "@/types"
import { getReportById } from "@/app/actions/reports"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ReportForm } from "@/components/reports/report-form"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/formatters"

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReportById(Number.parseInt(params.id))
        if (data) {
          setReport(data)
        } else {
          toast({
            title: "Error",
            description: "Reporte no encontrado.",
            variant: "destructive",
          })
          router.push("/dashboard/reports")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información del reporte.",
          variant: "destructive",
        })
        router.push("/dashboard/reports")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [params.id, router, toast])

  const refreshData = async () => {
    try {
      const data = await getReportById(Number.parseInt(params.id))
      if (data) {
        setReport(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del reporte.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Completado":
        return "border-green-500 bg-green-50 text-green-700"
      case "En proceso":
        return "border-amber-500 bg-amber-50 text-amber-700"
      case "Pendiente":
        return "border-red-500 bg-red-50 text-red-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "border-red-500 bg-red-50 text-red-700"
      case "Media":
        return "border-amber-500 bg-amber-50 text-amber-700"
      case "Baja":
        return "border-green-500 bg-green-50 text-green-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-gray-500">Reporte no encontrado.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/reports")} className="mt-4">
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-optilab-blue">Reporte: {report.machineName}</h1>
        </div>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsEditModalOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Reporte
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{report.reportType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getStatusBadgeColor(report.status)}>
              {report.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getPriorityBadgeColor(report.priority)}>
              {report.priority}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Reporte</CardTitle>
          <CardDescription>Detalles completos del reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Equipo</h3>
              <p className="mt-1">{report.machineName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reportado por</h3>
              <p className="mt-1">{report.reportedBy}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fecha de Reporte</h3>
              <p className="mt-1">{formatDate(report.reportDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Asignado a</h3>
              <p className="mt-1">{report.assignedTo || "No asignado"}</p>
            </div>
            {report.status === "Completado" && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Finalización</h3>
                  <p className="mt-1">{report.completedDate ? formatDate(report.completedDate) : "No especificada"}</p>
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
              <p className="mt-1">{report.description}</p>
            </div>
            {report.resolution && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Resolución</h3>
                <p className="mt-1">{report.resolution}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para editar reporte */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Reporte" size="lg">
        <ReportForm report={report} isEditing onClose={() => setIsEditModalOpen(false)} onSuccess={refreshData} />
      </Modal>
    </div>
  )
}
