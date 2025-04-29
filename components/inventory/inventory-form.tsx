"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/types"
import { createInventoryItem, updateInventoryItem } from "@/app/actions/inventory"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
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
              <SelectValue placeholder="Seleccionar categoría"

\
