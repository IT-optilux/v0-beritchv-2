"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { UsageLog, Machine, InventoryItem } from "@/types"
import { createUsageLog, updateUsageLog } from "@/app/actions/usage-logs"
import { getMachines } from "@/app/actions/machines"
import { getInventoryItems } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface UsageLogFormProps {
  log?: UsageLog
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function UsageLogForm({ log, isEditing = false, onClose, onSuccess }: UsageLogFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState<string>(log?.equipo_id.toString() || "")
  const [selectedItemId, setSelectedItemId] = useState<string>(log?.item_inventario_id.toString() || "")
  const [selectedMachineName, setSelectedMachineName] = useState<string>(log?.equipo_nombre || "")
  const [selectedItemName, setSelectedItemName] = useState<string>(log?.item_inventario_nombre || "")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const machinesData = await getMachines()
        setMachines(machinesData)

        const itemsData = await getInventoryItems()
        setInventoryItems(itemsData)

        if (log?.equipo_id) {
          const machine = machinesData.find((m) => m.id === log.equipo_id)
          if (machine) {
            setSelectedMachineName(machine.name)
          }
        }

        if (log?.item_inventario_id) {
          const item = itemsData.find((i) => i.id === log.item_inventario_id)
          if (item) {
            setSelectedItemName(item.name)
            setSelectedItem(item)
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [log, toast])

  const handleMachineChange = (value: string) => {
    setSelectedMachineId(value)
    const machine = machines.find((m) => m.id === Number(value))
    if (machine) {
      setSelectedMachineName(machine.name)
    }
  }

  const handleItemChange = (value: string) => {
    setSelectedItemId(value)
    const item = inventoryItems.find((i) => i.id === Number(value))
    if (item) {
      setSelectedItemName(item.name)
      setSelectedItem(item)
    } else {
      setSelectedItem(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("equipo_nombre", selectedMachineName)
    formData.append("item_inventario_nombre", selectedItemName)

    try {
      const result = isEditing ? await updateUsageLog(formData) : await createUsageLog(formData)

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
          router.push("/dashboard/usage-logs")
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
      {isEditing && <input type="hidden" name="id" value={log?.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="equipo_id">Equipo</Label>
          <Select name="equipo_id" value={selectedMachineId} onValueChange={handleMachineChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id.toString()}>
                  {machine.name} ({machine.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_inventario_id">Ítem de Inventario</Label>
          <Select name="item_inventario_id" value={selectedItemId} onValueChange={handleItemChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ítem" />
            </SelectTrigger>
            <SelectContent>
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name} ({item.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={log?.fecha || new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad_usada">Cantidad Usada</Label>
          <Input
            id="cantidad_usada"
            name="cantidad_usada"
            type="number"
            step="0.01"
            min="0"
            defaultValue={log?.cantidad_usada || 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidad_de_uso">Unidad de Uso</Label>
          <Select name="unidad_de_uso" defaultValue={log?.unidad_de_uso || selectedItem?.unidad_de_uso || ""} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cortes">Cortes</SelectItem>
              <SelectItem value="Horas">Horas</SelectItem>
              <SelectItem value="Ciclos">Ciclos</SelectItem>
              <SelectItem value="Días">Días</SelectItem>
              <SelectItem value="Unidades">Unidades</SelectItem>
              <SelectItem value="Litros">Litros</SelectItem>
              <SelectItem value="Kilogramos">Kilogramos</SelectItem>
              <SelectItem value="Metros">Metros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsable">Responsable</Label>
          <Input
            id="responsable"
            name="responsable"
            defaultValue={log?.responsable || ""}
            required
            placeholder="Nombre del responsable"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentarios">Comentarios</Label>
        <Textarea
          id="comentarios"
          name="comentarios"
          defaultValue={log?.comentarios || ""}
          placeholder="Comentarios adicionales (opcional)"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/usage-logs"))}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Registro" : "Crear Registro"}
        </Button>
      </div>
    </form>
  )
}
