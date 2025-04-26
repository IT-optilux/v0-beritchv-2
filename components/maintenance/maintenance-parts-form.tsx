"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { InventoryItem } from "@/types"
import { getInventoryItems } from "@/app/actions/inventory"
import { addMaintenancePart } from "@/app/actions/maintenance"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface MaintenancePartsFormProps {
  maintenanceId: number
  onClose: () => void
  onSuccess?: () => void
}

export function MaintenancePartsForm({ maintenanceId, onClose, onSuccess }: MaintenancePartsFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [cantidad, setCantidad] = useState<number>(1)
  const [costoUnitario, setCostoUnitario] = useState<number>(0)
  const [totalCosto, setTotalCosto] = useState<number>(0)

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const items = await getInventoryItems()
        // Filtrar solo los ítems que tienen stock disponible
        const availableItems = items.filter((item) => item.quantity > 0)
        setInventoryItems(availableItems)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los ítems de inventario.",
          variant: "destructive",
        })
      }
    }

    fetchInventoryItems()
  }, [toast])

  useEffect(() => {
    // Calcular el costo total cuando cambia la cantidad o el costo unitario
    setTotalCosto(cantidad * costoUnitario)
  }, [cantidad, costoUnitario])

  const handleItemChange = (value: string) => {
    setSelectedItemId(value)
    const item = inventoryItems.find((i) => i.id === Number(value))
    if (item) {
      setSelectedItem(item)
      // Si el ítem tiene un precio unitario definido, usarlo como valor predeterminado
      if (item.unitPrice) {
        setCostoUnitario(item.unitPrice)
      }
    } else {
      setSelectedItem(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("mantenimiento_id", maintenanceId.toString())
    formData.append("item_inventario_id", selectedItemId)
    formData.append("cantidad_utilizada", cantidad.toString())
    formData.append("costo_unitario", costoUnitario.toString())

    try {
      const result = await addMaintenancePart(formData)

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
        <div className="space-y-2">
          <Label htmlFor="item_inventario_id">Repuesto</Label>
          <Select name="item_inventario_id" value={selectedItemId} onValueChange={handleItemChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar repuesto" />
            </SelectTrigger>
            <SelectContent>
              {inventoryItems.length === 0 ? (
                <SelectItem value="no-items" disabled>
                  No hay repuestos disponibles en inventario
                </SelectItem>
              ) : (
                inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.quantity} disponibles)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedItem && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Información del repuesto:</p>
            <ul className="mt-1 list-inside list-disc">
              <li>Categoría: {selectedItem.category}</li>
              <li>Ubicación: {selectedItem.location}</li>
              <li>Cantidad disponible: {selectedItem.quantity}</li>
              {selectedItem.unitPrice && <li>Precio unitario sugerido: ${selectedItem.unitPrice.toFixed(2)}</li>}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cantidad_utilizada">Cantidad Utilizada</Label>
          <Input
            id="cantidad_utilizada"
            type="number"
            min="1"
            max={selectedItem?.quantity || 1}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            required
          />
          {selectedItem && (
            <p className="text-xs text-gray-500">
              Máximo disponible: {selectedItem.quantity} {selectedItem.unidad_de_uso || "unidades"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="costo_unitario">Costo Unitario</Label>
          <Input
            id="costo_unitario"
            type="number"
            step="0.01"
            min="0"
            value={costoUnitario}
            onChange={(e) => setCostoUnitario(Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Costo Total</Label>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">${totalCosto.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-optilab-blue hover:bg-optilab-blue/90"
          disabled={isSubmitting || !selectedItemId || cantidad < 1}
        >
          {isSubmitting ? "Procesando..." : "Registrar Repuesto"}
        </Button>
      </div>
    </form>
  )
}
