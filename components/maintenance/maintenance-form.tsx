"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { maintenanceService, machineService, notificationService } from "@/lib/firebase-services"
import type { Machine } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceFormProps {
  machines?: Machine[]
  initialMachineId?: string | null
  initialDate?: string
  onSuccess: () => void
  onCancel?: () => void
}

export function MaintenanceForm({
  machines = [],
  initialMachineId = null,
  initialDate,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(initialMachineId)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [formData, setFormData] = useState({
    maintenanceType: "Preventivo",
    description: "",
    startDate: initialDate || new Date().toISOString().split("T")[0],
    endDate: "",
    status: "Programado",
    technician: "",
    cost: "",
    observations: "",
  })

  useEffect(() => {
    if (selectedMachineId && machines.length > 0) {
      const machine = machines.find((m) => m.id === selectedMachineId)
      setSelectedMachine(machine || null)
    }
  }, [selectedMachineId, machines])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMachineChange = (machineId: string) => {
    setSelectedMachineId(machineId)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedMachineId || !selectedMachine) {
      toast({
        title: "Error",
        description: "Debes seleccionar un equipo",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create maintenance record
      const maintenanceData = {
        machineId: Number(selectedMachineId),
        machineName: selectedMachine.name,
        maintenanceType: formData.maintenanceType,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        technician: formData.technician,
        cost: formData.cost ? Number(formData.cost) : null,
        observations: formData.observations,
      }

      await maintenanceService.create(maintenanceData)

      // Update machine's nextMaintenance date
      await machineService.update(selectedMachineId, {
        nextMaintenance: formData.startDate,
      })

      // Create notification
      await notificationService.create({
        type: "maintenance",
        title: "Mantenimiento programado",
        message: `Se ha programado un mantenimiento ${formData.maintenanceType.toLowerCase()} para ${selectedMachine.name} el ${new Date(formData.startDate).toLocaleDateString()}`,
        severity: "medium",
        relatedId: selectedMachineId,
        read: false,
      })

      toast({
        title: "Éxito",
        description: "Mantenimiento programado correctamente",
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating maintenance:", error)
      toast({
        title: "Error",
        description: "No se pudo programar el mantenimiento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="machineId">Equipo</Label>
          <Select
            value={selectedMachineId || ""}
            onValueChange={handleMachineChange}
            disabled={!!initialMachineId || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un equipo" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name} ({machine.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenanceType">Tipo de Mantenimiento</Label>
          <Select
            value={formData.maintenanceType}
            onValueChange={(value) => handleSelectChange("maintenanceType", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Preventivo">Preventivo</SelectItem>
              <SelectItem value="Correctivo">Correctivo</SelectItem>
              <SelectItem value="Calibración">Calibración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el mantenimiento a realizar"
            rows={3}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de Inicio</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de Finalización (opcional)</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Programado">Programado</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="technician">Técnico Responsable</Label>
            <Input
              id="technician"
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              placeholder="Nombre del técnico"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cost">Costo Estimado (opcional)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones (opcional)</Label>
          <Textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            placeholder="Observaciones adicionales"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Mantenimiento"}
        </Button>
      </div>
    </form>
  )
}
