"use client"

import type React from "react"

import { useState } from "react"
import type { InventoryItem } from "@/types"
import { adjustInventoryQuantity } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface QuantityAdjustmentFormProps {
  item: InventoryItem
  onClose: () => void
  onSuccess?: () => void
}

export function QuantityAdjustmentForm({ item, onClose, onSuccess }: QuantityAdjustmentFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("id", item.id.toString())
    formData.append("adjustmentType", adjustmentType)
    formData.append("adjustmentQuantity", quantity.toString())

    try {
      const result = await adjustInventoryQuantity(formData)

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
          <Label className="text-base">Ítem: {item.name}</Label>
          <p className="text-sm text-gray-500">Cantidad actual: {item.quantity}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustmentType">Tipo de Ajuste</Label>
          <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as "add" | "subtract")}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de ajuste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Agregar</SelectItem>
              <SelectItem value="subtract">Restar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "Ajustar Cantidad"}
        </Button>
      </div>
    </form>
  )
}
