"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Machine, InventoryItem } from "@/types"
import { createMachine, updateMachine } from "@/app/actions/machines"
import { getInventoryItems } from "@/app/actions/inventory"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { collection, addDoc } from "firebase/firestore";
import { getUserSession } from '@/lib/cookies';
import { db } from "@/lib/firebase";


interface MachineFormProps {
  machine?: Machine
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function MachineForm({ machine, isEditing = false, onClose, onSuccess }: MachineFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)

  const { email, uid } = getUserSession();

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const items = await getInventoryItems()
        setInventoryItems(items)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los ítems de inventario.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingInventory(false)
      }
    }

    fetchInventoryItems()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    console.log("Form Data:", Object.fromEntries(formData.entries()))
    const resJson = Object.fromEntries(formData.entries())

    try {
      const result = isEditing ? await updateMachine(formData) : await createMachine(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        if (onSuccess) {
          try {

            if (email) {
              const docRef = await addDoc(collection(db, "MachineReports"), {
                ...resJson,
                userId: uid,
                userEmail: email,
                createdAt: new Date(),
              });

              console.log("Reporte creado con ID:", docRef.id);
            }
          } catch (error) {
            console.error("Error al crear el reporte: ", error);
          }

          onSuccess()
        }

        if (onClose) {
          onClose()
        } else {
          router.push("/dashboard/machines")
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
      {isEditing && <input type="hidden" name="id" value={machine?.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Equipo</Label>
          <Input id="name" name="name" defaultValue={machine?.name} required placeholder="Ej: Biseladora Automática" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={machine?.model} required placeholder="Ej: BA-2000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Número de Serie</Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            defaultValue={machine?.serialNumber}
            required
            placeholder="Ej: BA2000-12345"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select name="status" defaultValue={machine?.status || "Operativa"}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Operativa">Operativa</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="Inoperativa">Inoperativa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastMaintenance">Último Mantenimiento</Label>
          <Input
            id="lastMaintenance"
            name="lastMaintenance"
            type="date"
            defaultValue={machine?.lastMaintenance}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextMaintenance">Próximo Mantenimiento</Label>
          <Input
            id="nextMaintenance"
            name="nextMaintenance"
            type="date"
            defaultValue={machine?.nextMaintenance}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" name="location" defaultValue={machine?.location} placeholder="Ej: Área de Producción" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Fabricante</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            defaultValue={machine?.manufacturer}
            placeholder="Ej: OptiTech"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Fecha de Compra</Label>
          <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={machine?.purchaseDate} />
        </div>

        {/* Nuevo campo: Ítem de Inventario Asociado */}
        <div className="space-y-2">
          <Label htmlFor="item_inventario_asociado">Ítem de Inventario Asociado</Label>
          <Select
            name="item_inventario_asociado"
            defaultValue={machine?.item_inventario_asociado?.toString() || "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ítem de inventario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {isLoadingInventory ? (
                <SelectItem value="loading" disabled>
                  Cargando ítems...
                </SelectItem>
              ) : (
                inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.category})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Opcional: Asociar un ítem del inventario a este equipo</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={machine?.description}
          placeholder="Descripción detallada del equipo"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/machines"))}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Equipo" : "Crear Equipo"}
        </Button>
      </div>
    </form>
  )
}
