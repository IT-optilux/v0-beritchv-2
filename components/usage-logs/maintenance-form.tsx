"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { registrarMantenimiento } from "@/app/actions/usage-logs"

interface MaintenanceFormProps {
  item: {
    equipo_id: number
    equipo_nombre: string
    item_inventario_id: number
    item_inventario_nombre: string
    unidad_de_uso: string
    uso_acumulado: number
    vida_util_maxima: number
    porcentaje_uso: number
  }
  onClose: () => void
  onSuccess?: () => void
}

export function MaintenanceForm({ item, onClose, onSuccess }: MaintenanceFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("equipo_id", item.equipo_id.toString())
    formData.append("equipo_nombre", item.equipo_nombre)
    formData.append("item_inventario_id", item.item_inventario_id.toString())
    formData.append("item_inventario_nombre", item.item_inventario_nombre)
    formData.append("unidad_de_uso", item.unidad_de_uso)

    try {
      const result = await registrarMantenimiento(formData)

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
          description: result.message || "Ha ocurrido un error al registrar el mantenimiento.",
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
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Información del ítem:</p>
        <ul className="mt-2 list-inside list-disc">
          <li>Equipo: {item.equipo_nombre}</li>
          <li>Ítem: {item.item_inventario_nombre}</li>
          <li>
            Uso actual: {item.uso_acumulado} de {item.vida_util_maxima} {item.unidad_de_uso} (
            {item.porcentaje_uso.toFixed(1)}%)
          </li>
        </ul>
        <p className="mt-2">
          Al registrar este mantenimiento, se reiniciará el contador de uso para este ítem en este equipo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha de Mantenimiento</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsable">Responsable</Label>
          <Input id="responsable" name="responsable" required placeholder="Nombre del técnico o responsable" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentarios">Detalles del Mantenimiento</Label>
          <Textarea
            id="comentarios"
            name="comentarios"
            placeholder="Describa las acciones realizadas durante el mantenimiento"
            rows={3}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "Registrar Mantenimiento"}
        </Button>
      </div>
    </form>
  )
}
