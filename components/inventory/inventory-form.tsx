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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = ["Moldes", "Bloques", "Consumibles", "Químicos", "Repuestos", "Herramientas", "Otros"]
  const locations = ["Almacén A", "Almacén B", "Almacén C", "Almacén D", "Área de Producción", "Área de Mantenimiento"]
  const tiposDeItem = ["consumible", "pieza de desgaste", "repuesto general"]
  const unidadesDeUso = ["Horas", "Cortes", "Ciclos", "Días", "Usos"]

  const handleTipoItemChange = (value: string) => {
    setTipoItem(value)
    setMostrarCamposAdicionales(value === "pieza de desgaste")

    // Limpiar errores relacionados con campos adicionales si ya no son relevantes
    if (value !== "pieza de desgaste") {
      const newErrors = { ...errors }
      delete newErrors.unidad_de_uso
      delete newErrors.vida_util_maxima
      setErrors(newErrors)
    }
  }

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar campos obligatorios
    const name = formData.get("name") as string
    if (!name) newErrors.name = "El nombre es obligatorio"

    const quantity = formData.get("quantity") as string
    if (!quantity) {
      newErrors.quantity = "La cantidad es obligatoria"
    } else if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = "La cantidad debe ser un número no negativo"
    }

    const minQuantity = formData.get("minQuantity") as string
    if (!minQuantity) {
      newErrors.minQuantity = "La cantidad mínima es obligatoria"
    } else if (isNaN(Number(minQuantity)) || Number(minQuantity) < 0) {
      newErrors.minQuantity = "La cantidad mínima debe ser un número no negativo"
    }

    // Validar campos adicionales para piezas de desgaste
    if (tipoItem === "pieza de desgaste") {
      const unidadDeUso = formData.get("unidad_de_uso") as string
      if (!unidadDeUso) {
        newErrors.unidad_de_uso = "La unidad de uso es obligatoria para piezas de desgaste"
      }

      const vidaUtilMaxima = formData.get("vida_util_maxima") as string
      if (!vidaUtilMaxima) {
        newErrors.vida_util_maxima = "La vida útil máxima es obligatoria para piezas de desgaste"
      } else if (isNaN(Number(vidaUtilMaxima)) || Number(vidaUtilMaxima) <= 0) {
        newErrors.vida_util_maxima = "La vida útil máxima debe ser un número positivo"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    if (!validateForm(formData)) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrija los errores en el formulario",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

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
          <Input
            id="name"
            name="name"
            defaultValue={item?.name}
            required
            placeholder="Ej: Moldes CR-39"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select name="category" defaultValue={item?.category || categories[0]} disabled={isSubmitting}>
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
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            defaultValue={item?.quantity || 0}
            required
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
            disabled={isSubmitting}
          />
          {errors.quantity && (
            <p id="quantity-error" className="text-sm text-red-500">
              {errors.quantity}
            </p>
          )}
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
            aria-invalid={!!errors.minQuantity}
            aria-describedby={errors.minQuantity ? "minQuantity-error" : undefined}
            disabled={isSubmitting}
          />
          {errors.minQuantity && (
            <p id="minQuantity-error" className="text-sm text-red-500">
              {errors.minQuantity}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Select name="location" defaultValue={item?.location || locations[0]} disabled={isSubmitting}>
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
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor</Label>
          <Input
            id="supplier"
            name="supplier"
            defaultValue={item?.supplier}
            placeholder="Nombre del proveedor"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_de_item">Tipo de Ítem</Label>
          <Select
            name="tipo_de_item"
            value={tipoItem}
            onValueChange={handleTipoItemChange}
            defaultValue={item?.tipo_de_item}
            disabled={isSubmitting}
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

      {mostrarCamposAdicionales && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-medium text-blue-800">Información de Pieza de Desgaste</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unidad_de_uso">Unidad de Uso</Label>
              <Select
                name="unidad_de_uso"
                defaultValue={item?.unidad_de_uso || unidadesDeUso[0]}
                disabled={isSubmitting}
              >
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
              {errors.unidad_de_uso && <p className="text-sm text-red-500">{errors.unidad_de_uso}</p>}
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
                aria-invalid={!!errors.vida_util_maxima}
                aria-describedby={errors.vida_util_maxima ? "vida-util-error" : undefined}
                disabled={isSubmitting}
              />
              {errors.vida_util_maxima && (
                <p id="vida-util-error" className="text-sm text-red-500">
                  {errors.vida_util_maxima}
                </p>
              )}
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
          disabled={isSubmitting}
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
