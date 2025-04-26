"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Maintenance, Machine } from "@/types"
import { createMaintenance, updateMaintenance } from "@/app/actions/maintenance"
import { getMachines } from "@/app/actions/machines"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceFormProps {
  maintenance?: Maintenance
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function MaintenanceForm({ maintenance, isEditing = false, onClose, onSuccess }: MaintenanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState<string>(maintenance?.machineId.toString() || "")
  const [selectedMachineName, setSelectedMachineName] = useState<string>(maintenance?.machineName || "")

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesData = await getMachines()
        setMachines(machinesData)

        if (maintenance?.machineId) {
          const machine = machinesData.find((m) => m.id === maintenance.machineId)
          if (machine) {
            setSelectedMachineName(machine.name)
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las máquinas.",
          variant: "destructive",
        })
      }
    }

    fetchMachines()
  }, [maintenance?.machineId, toast])

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
      const result = isEditing ? await updateMaintenance(formData) : await createMaintenance(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        if (onSuccess) {
          onSuccess()
        }

        if (onClose) {
          onClose()
        } else {
          router.push("/dashboard/maintenance")
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
      {isEditing && <input type="hidden" name="id" value={maintenance?.id} />}

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
                  {machine.name} ({machine.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenanceType">Tipo de Mantenimiento</Label>
          <Select name="maintenanceType" defaultValue={maintenance?.maintenanceType || "Preventivo"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Preventivo">Preventivo</SelectItem>
              <SelectItem value="Correctivo">Correctivo</SelectItem>
              <SelectItem value="Calibración">Calibración</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha de Inicio</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={maintenance?.startDate || new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha de Finalización</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={maintenance?.endDate}
            placeholder="Dejar en blanco si aún no ha finalizado"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={maintenance?.status || "Programado"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Programado">Programado</SelectItem>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Completado">Completado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technician">Técnico Responsable</Label>
          <Input
            id="technician"
            name="technician"
            defaultValue={maintenance?.technician}
            required
            placeholder="Nombre del técnico"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Costo (opcional)</Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={maintenance?.cost}
            placeholder="Costo total del mantenimiento"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={maintenance?.description}
          placeholder="Descripción detallada del mantenimiento"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={maintenance?.observations}
          placeholder="Observaciones adicionales (opcional)"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/maintenance"))}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Mantenimiento" : "Crear Mantenimiento"}
        </Button>
      </div>
    </form>
  )
}
