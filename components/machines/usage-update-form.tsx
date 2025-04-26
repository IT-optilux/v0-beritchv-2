"use client"

import type React from "react"

import { useState } from "react"
import type { MachinePart } from "@/types"
import { updatePartUsage } from "@/app/actions/machines"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface UsageUpdateFormProps {
  part: MachinePart
  onClose: () => void
  onSuccess?: () => void
}

export function UsageUpdateForm({ part, onClose, onSuccess }: UsageUpdateFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [additionalUsage, setAdditionalUsage] = useState(1)

  const usagePercentage = (part.currentUsage / part.maxUsage) * 100
  const remainingUsage = part.maxUsage - part.currentUsage

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("id", part.id.toString())
    formData.append("additionalUsage", additionalUsage.toString())

    try {
      const result = await updatePartUsage(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        // Si el estado cambió, mostrar una notificación adicional
        if (result.statusChanged) {
          const statusMessages = {
            Normal: "La pieza está en estado normal.",
            Advertencia: "¡Atención! La pieza ha alcanzado el 75% de su vida útil.",
            Crítico: "¡Crítico! La pieza ha alcanzado el 100% de su vida útil y debe ser reemplazada.",
          }

          toast({
            title: `Estado cambiado a: ${result.newStatus}`,
            description: statusMessages[result.newStatus as keyof typeof statusMessages],
            variant:
              result.newStatus === "Crítico"
                ? "destructive"
                : result.newStatus === "Advertencia"
                  ? "warning"
                  : "default",
          })
        }

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
          <Label className="text-base">Pieza: {part.name}</Label>
          <p className="text-sm text-gray-500">
            Uso actual: {part.currentUsage} de {part.maxUsage} {part.usageType} ({usagePercentage.toFixed(1)}%)
          </p>
          <p className="text-sm text-gray-500">
            Restante: {remainingUsage} {part.usageType}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Progreso de desgaste</Label>
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
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{part.maxUsage}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalUsage">Registrar uso adicional ({part.usageType})</Label>
          <Input
            id="additionalUsage"
            type="number"
            min="1"
            value={additionalUsage}
            onChange={(e) => setAdditionalUsage(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "Registrar Uso"}
        </Button>
      </div>
    </form>
  )
}
