"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/types"
import { createInventoryItem, updateInventoryItem } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface InventoryFormProps {
  item?: InventoryItem
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function InventoryForm({ item, isEditing = false, onClose, onSuccess }: InventoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipoItem, setTipoItem] = useState<string>(item?.tipo_de_item || "")
  const [mostrarCamposAdicionales, setMostrarCamposAdicionales] = useState<boolean>(
    !!item?.tipo_de_item && item?.tipo_de_item === "pieza de desgaste",
  )

  const categories = ["Moldes", "Bloques", "Consumibles", "Químicos", "Repuestos", "Herramientas", "Otros"]
  const locations = ["Almacén A", "Almacén B", "Almacén C", "Almacén D", "Área de Producción", "Área de Mantenimiento"]
  const tiposDeItem = ["consumible", "pieza de desgaste", "repuesto general"]
  const unidadesDeUso = ["Horas", "Cortes", "Ciclos", "Días", "Usos"]

  const handleTipoItemChange = (value: string) => {
    setTipoItem(value)
    setMostrarCamposAdicionales(value === "pieza de desgaste")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = isEditing ? await updateInventoryItem(formData) : await createInventoryItem(formData)

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
          router.push("/dashboard/inventory")
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
      {isEditing && <input type="hidden" name="id" value={item?.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Ítem</Label>
          <Input id="name" name="name" defaultValue={item?.name} required placeholder="Ej: Moldes CR-39" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select name="category" defaultValue={item?.category || categories[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input id="quantity" name="quantity" type="number" min="0" defaultValue={item?.quantity || 0} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minQuantity">Cantidad Mínima</Label>
          <Input
            id="minQuantity"
            name="minQuantity"
            type="number"
            min="0"
            defaultValue={item?.minQuantity || 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Select name="location" defaultValue={item?.location || locations[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Precio Unitario</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item?.unitPrice || 0}
            placeholder="Precio por unidad"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor</Label>
          <Input id="supplier" name="supplier" defaultValue={item?.supplier} placeholder="Nombre del proveedor" />
        </div>

        {/* Nuevo campo: Tipo de Ítem */}
        <div className="space-y-2">
          <Label htmlFor="tipo_de_item">Tipo de Ítem</Label>
          <Select
            name="tipo_de_item"
            value={tipoItem}
            onValueChange={handleTipoItemChange}
            defaultValue={item?.tipo_de_item}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de ítem" />
            </SelectTrigger>
            <SelectContent>
              {tiposDeItem.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campos adicionales para piezas de desgaste */}
      {mostrarCamposAdicionales && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-medium text-blue-800">Información de Pieza de Desgaste</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unidad_de_uso">Unidad de Uso</Label>
              <Select name="unidad_de_uso" defaultValue={item?.unidad_de_uso || unidadesDeUso[0]}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesDeUso.map((unidad) => (
                    <SelectItem key={unidad} value={unidad}>
                      {unidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-700">Ejemplo: Horas, Cortes, Ciclos, etc.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vida_util_maxima">Vida Útil Máxima</Label>
              <Input
                id="vida_util_maxima"
                name="vida_util_maxima"
                type="number"
                min="1"
                defaultValue={item?.vida_util_maxima || 10000}
                placeholder="Ej: 25000"
              />
              <p className="text-xs text-blue-700">Cantidad máxima de uso antes de reemplazo</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={item?.description}
          placeholder="Descripción detallada del ítem"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/inventory"))}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Ítem" : "Crear Ítem"}
        </Button>
      </div>
    </form>
  )
}
