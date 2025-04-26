"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { MachinePart, InventoryItem } from "@/types"
import { replaceMachinePart } from "@/app/actions/machines"
import { getWearParts } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface PartReplacementFormProps {
  part: MachinePart
  onClose: () => void
  onSuccess?: () => void
}

export function PartReplacementForm({ part, onClose, onSuccess }: PartReplacementFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wearParts, setWearParts] = useState<InventoryItem[]>([])
  const [selectedPart, setSelectedPart] = useState<string>("")
  const [selectedPartDetails, setSelectedPartDetails] = useState<InventoryItem | null>(null)

  const usagePercentage = (part.currentUsage / part.maxUsage) * 100

  useEffect(() => {
    const fetchWearParts = async () => {
      try {
        // Obtener solo las piezas del mismo tipo que la que se va a reemplazar
        const parts = await getWearParts()
        const compatibleParts = parts.filter(
          (p) => p.name === part.name || (p.lifespanUnit === part.usageType && p.quantity > 0),
        )
        setWearParts(compatibleParts)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las piezas de desgaste disponibles.",
          variant: "destructive",
        })
      }
    }

    fetchWearParts()
  }, [part, toast])

  const handlePartChange = (value: string) => {
    setSelectedPart(value)
    const selectedItem = wearParts.find((p) => p.id === Number(value))
    setSelectedPartDetails(selectedItem || null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("partId", part.id.toString())
    formData.append("newInventoryItemId", selectedPart)

    try {
      const result = await replaceMachinePart(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        if (onSuccess) {
          onSuccess()
        }
        onClose()
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
      <div className="space-y-4">
        <div>
          <Label className="text-base">Pieza a reemplazar: {part.name}</Label>
          <p className="text-sm text-gray-500">
            Uso actual: {part.currentUsage} de {part.maxUsage} {part.usageType} ({usagePercentage.toFixed(1)}%)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Estado actual</Label>
            <span className="text-sm font-medium">{usagePercentage.toFixed(1)}%</span>
          </div>
          <Progress
            value={usagePercentage}
            className={`h-2 ${
              usagePercentage >= 100 ? "bg-red-100" : usagePercentage >= 75 ? "bg-amber-100" : "bg-green-100"
            }`}
            indicatorClassName={`${
              usagePercentage >= 100 ? "bg-red-500" : usagePercentage >= 75 ? "bg-amber-500" : "bg-green-500"
            }`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newInventoryItemId">Seleccionar repuesto</Label>
          <Select name="newInventoryItemId" value={selectedPart} onValueChange={handlePartChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar pieza de repuesto" />
            </SelectTrigger>
            <SelectContent>
              {wearParts.length === 0 ? (
                <SelectItem value="no-parts" disabled>
                  No hay repuestos compatibles disponibles
                </SelectItem>
              ) : (
                wearParts.map((wearPart) => (
                  <SelectItem key={wearPart.id} value={wearPart.id.toString()}>
                    {wearPart.name} ({wearPart.quantity} disponibles)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedPartDetails && (
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium">Información del repuesto seleccionado:</p>
            <ul className="mt-2 list-inside list-disc">
              <li>
                Vida útil: {selectedPartDetails.lifespan} {selectedPartDetails.lifespanUnit}
              </li>
              <li>Cantidad disponible: {selectedPartDetails.quantity}</li>
              <li>Ubicación: {selectedPartDetails.location}</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-optilab-blue hover:bg-optilab-blue/90"
          disabled={isSubmitting || !selectedPart || wearParts.length === 0}
        >
          {isSubmitting ? "Procesando..." : "Reemplazar Pieza"}
        </Button>
      </div>
    </form>
  )
}
