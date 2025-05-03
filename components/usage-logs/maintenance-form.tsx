"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usageLogService } from "@/lib/firebase-services"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceFormProps {
  item: {
    equipo_id: number
    equipo_nombre: string
    item_inventario_id: number
    item_inventario_nombre: string
    unidad_de_uso: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function MaintenanceForm({ item, onClose, onSuccess }: MaintenanceFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      const data = {
        equipo_nombre: item.equipo_nombre,
        item_inventario_nombre: item.item_inventario_nombre,
        fecha: formData.get("fecha") as string,
        unidad_de_uso: item.unidad_de_uso,
        responsable: formData.get("responsable") as string,
        comentarios: formData.get("comentarios") as string,
      }

      await usageLogService.registrarMantenimiento(item.equipo_id, item.item_inventario_id, data)

      toast({
        title: "Éxito",
        description: "Mantenimiento registrado correctamente",
      })

      onSuccess()
    } catch (error) {
      console.error("Error al registrar mantenimiento:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el mantenimiento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-800">Información del Ítem</h3>
        <p className="mt-1 text-sm text-blue-700">
          {item.item_inventario_nombre} en {item.equipo_nombre}
        </p>
        <p className="mt-1 text-sm text-blue-700">Unidad de uso: {item.unidad_de_uso}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha de Mantenimiento</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsable">Responsable</Label>
        <Input id="responsable" name="responsable" required placeholder="Nombre del técnico responsable" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentarios">Comentarios</Label>
        <Textarea id="comentarios" name="comentarios" placeholder="Detalles del mantenimiento realizado" rows={3} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar Mantenimiento"}
        </Button>
      </div>
    </form>
  )
}
