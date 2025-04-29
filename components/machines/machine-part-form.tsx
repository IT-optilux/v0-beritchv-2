"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { MachinePart, InventoryItem } from "@/types"
import { addMachinePart, updateMachinePart } from "@/app/actions/machines"
import { getWearParts } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface MachinePartFormProps {
  machineId: number
  machineName: string
  part?: MachinePart
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function MachinePartForm({
  machineId,
  machineName,
  part,
  isEditing = false,
  onClose,
  onSuccess,
}: MachinePartFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wearParts, setWearParts] = useState<InventoryItem[]>([])
  const [selectedPart, setSelectedPart] = useState<string>(part?.inventoryItemId.toString() || "")
  const [selectedPartDetails, setSelectedPartDetails] = useState<InventoryItem | null>(null)

  useEffect(() => {
    const fetchWearParts = async () => {
      try {
        const parts = await getWearParts()
        setWearParts(parts)

        if (part && part.inventoryItemId) {
          const selectedItem = parts.find((p) => p.id === part.inventoryItemId)
          if (selectedItem) {
            setSelectedPartDetails(selectedItem)
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las piezas de desgaste.",
          variant: "destructive",
        })
      }
    }

    fetchWearParts()
  }, [part?.inventoryItemId, toast])

  const handlePartChange = (value: string) => {
    setSelectedPart(value)
    const selectedItem = wearParts.find((p) => p.id === Number(value))
    setSelectedPartDetails(selectedItem || null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("machineId", machineId.toString())

    try {
      const result = isEditing ? await updateMachinePart(formData) : await addMachinePart(formData)

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
      {isEditing && <input type="hidden" name="id" value={part?.id} />}

      <div className="space-y-2">
        <Label>Máquina</Label>
        <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{machineName}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inventoryItemId">Pieza de Desgaste</Label>
          <Select name="inventoryItemId" value={selectedPart} onValueChange={handlePartChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar pieza" />
            </SelectTrigger>
            <SelectContent>
              {wearParts.map((wearPart) => (
                <SelectItem key={wearPart.id} value={wearPart.id.toString()}>
                  {wearPart.name} ({wearPart.quantity} disponibles)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la Pieza</Label>
          <Input
            id="name"
            name="name"
            defaultValue={part?.name || selectedPartDetails?.name || ""}
            required
            placeholder="Ej: Disco de corte principal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installationDate">Fecha de Instalación</Label>
          <Input
            id="installationDate"
            name="installationDate"
            type="date"
            defaultValue={part?.installationDate || new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usageType">Tipo de Uso</Label>
          <Select
            name="usageType"
            defaultValue={part?.usageType || selectedPartDetails?.lifespanUnit || "Cortes"}
            disabled={!!selectedPartDetails?.lifespanUnit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de uso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cortes">Cortes</SelectItem>
              <SelectItem value="Horas">Horas</SelectItem>
              <SelectItem value="Ciclos">Ciclos</SelectItem>
              <SelectItem value="Días">Días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxUsage">Uso Máximo</Label>
          <Input
            id="maxUsage"
            name="maxUsage"
            type="number"
            min="1"
            defaultValue={part?.maxUsage || selectedPartDetails?.lifespan || 25000}
            required
            disabled={!!selectedPartDetails?.lifespan}
          />
          <p className="text-xs text-gray-500">
            Cantidad máxima de {selectedPartDetails?.lifespanUnit || part?.usageType || "uso"} antes de reemplazo
          </p>
        </div>
      </div>

      {selectedPartDetails && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">Información de la pieza seleccionada:</p>
          <ul className="mt-2 list-inside list-disc">
            <li>
              Vida útil: {selectedPartDetails.lifespan} {selectedPartDetails.lifespanUnit}
            </li>
            <li>Cantidad disponible: {selectedPartDetails.quantity}</li>
            <li>Ubicación: {selectedPartDetails.location}</li>
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Pieza" : "Añadir Pieza"}
        </Button>
      </div>
    </form>
  )
}
