"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Report, Machine } from "@/types"
import { createReport, updateReport } from "@/app/actions/reports"
import { getMachines } from "@/app/actions/machines"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ReportFormProps {
  report?: Report
  isEditing?: boolean
  onClose?: () => void
}

export function ReportForm({ report, isEditing = false, onClose }: ReportFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState<string>(report?.machineId.toString() || "")
  const [selectedMachineName, setSelectedMachineName] = useState<string>(report?.machineName || "")

  useEffect(() => {
    const fetchMachines = async () => {
      const machinesData = await getMachines()
      setMachines(machinesData)

      if (report?.machineId) {
        const machine = machinesData.find((m) => m.id === report.machineId)
        if (machine) {
          setSelectedMachineName(machine.name)
        }
      }
    }

    fetchMachines()
  }, [report?.machineId])

  const handleMachineChange = (value: string) => {
    setSelectedMachineId(value)
    const machine = machines.find((m) => m.id === Number(value))
    if (machine) {
      setSelectedMachineName(machine.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("machineName", selectedMachineName)

    try {
      const result = isEditing ? await updateReport(formData) : await createReport(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        if (onClose) {
          onClose()
        } else {
          router.push("/dashboard/reports")
        }
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
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={report?.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="machineId">Equipo</Label>
          <Select name="machineId" value={selectedMachineId} onValueChange={handleMachineChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id.toString()}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportType">Tipo de Reporte</Label>
          <Select name="reportType" defaultValue={report?.reportType || "Falla"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Falla">Falla</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="Calibración">Calibración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select name="priority" defaultValue={report?.priority || "Media"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={report?.status || "Pendiente"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Completado">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportedBy">Reportado por</Label>
          <Input
            id="reportedBy"
            name="reportedBy"
            defaultValue={report?.reportedBy}
            required
            placeholder="Nombre del reportante"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportDate">Fecha de Reporte</Label>
          <Input
            id="reportDate"
            name="reportDate"
            type="date"
            defaultValue={report?.reportDate || new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo">Asignado a</Label>
          <Input
            id="assignedTo"
            name="assignedTo"
            defaultValue={report?.assignedTo}
            placeholder="Nombre del técnico asignado"
          />
        </div>

        {report?.status === "Completado" || (
          <div className="space-y-2">
            <Label htmlFor="completedDate">Fecha de Finalización</Label>
            <Input id="completedDate" name="completedDate" type="date" defaultValue={report?.completedDate} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={report?.description}
          placeholder="Descripción detallada del reporte"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resolution">Resolución</Label>
        <Textarea
          id="resolution"
          name="resolution"
          defaultValue={report?.resolution}
          placeholder="Detalles de la resolución (si aplica)"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/reports"))}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Reporte" : "Crear Reporte"}
        </Button>
      </div>
    </form>
  )
}
