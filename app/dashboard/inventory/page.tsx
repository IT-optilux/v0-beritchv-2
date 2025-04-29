"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import type { InventoryItem } from "@/types"
import { getInventoryItems, deleteInventoryItem } from "@/app/actions/inventory"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { InventoryForm } from "@/components/inventory/inventory-form"
import { QuantityAdjustmentForm } from "@/components/inventory/quantity-adjustment-form"
import { useToast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const { toast } = useToast()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [tipoItemFilter, setTipoItemFilter] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const data = await getInventoryItems()
        setInventoryItems(data)
        setFilteredItems(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los ítems de inventario.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventoryItems()
  }, [toast])

  useEffect(() => {
    let result = inventoryItems

    // Aplicar filtro de búsqueda
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Aplicar filtro de categoría
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter)
    }

    // Aplicar filtro de estado
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter)
    }

    // Aplicar filtro de tipo de ítem
    if (tipoItemFilter) {
      result = result.filter((item) => item.tipo_de_item === tipoItemFilter)
    }

    setFilteredItems(result)
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter, tipoItemFilter])

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsEditModalOpen(true)
  }

  const handleAdjust = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsAdjustModalOpen(true)
  }

  const handleDelete = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedItem) return

    const itemToDelete = selectedItem // Capturar el valor actual
    setIsDeleting(true)
    try {
      const result = await deleteInventoryItem(itemToDelete.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setInventoryItems(inventoryItems.filter((item) => item.id !== itemToDelete.id))
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
        description: "Ha ocurrido un error al eliminar el ítem.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getInventoryItems()
      setInventoryItems(data)
      setFilteredItems(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  // Obtener categorías únicas para el filtro
  const categories = [...new Set(inventoryItems.map((item) => item.category))]

  // Tipos de ítem para el filtro
  const tiposDeItem = ["consumible", "pieza de desgaste", "repuesto general"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Inventario</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ítem
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Inventario</CardTitle>
          <CardDescription>Gestione todos los ítems de inventario del laboratorio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar en inventario..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="En stock">En stock</option>
              <option value="Bajo stock">Bajo stock</option>
              <option value="Sin stock">Sin stock</option>
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={tipoItemFilter}
              onChange={(e) => setTipoItemFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tiposDeItem.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {inventoryItems.length === 0
                        ? "No hay ítems de inventario registrados."
                        : "No se encontraron ítems que coincidan con los filtros."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.tipo_de_item ? (
                          <Badge variant="outline" className="capitalize">
                            {item.tipo_de_item}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.quantity} / {item.minQuantity} min.
                      </TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.status === "En stock"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : item.status === "Bajo stock"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-red-500 bg-red-50 text-red-700"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-optilab-blue" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAdjust(item)}>
                            Ajustar
                          </Button>
                          <Link
                            href={`/dashboard/inventory/${item.id}/history`}
                            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-optilab-blue hover:bg-gray-100"
                          >
                            Historial
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar ítem */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Nuevo Ítem de Inventario"
        size="lg"
      >
        <InventoryForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar ítem */}
      {selectedItem && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedItem(null)
          }}
          title="Editar Ítem de Inventario"
          size="lg"
        >
          <InventoryForm
            item={selectedItem}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedItem(null)
            }}
            onSuccess={refreshData}
          />
        </Modal>
      )}

      {/* Modal para ajustar cantidad */}
      {selectedItem && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false)
            setSelectedItem(null)
          }}
          title="Ajustar Cantidad"
          size="sm"
        >
          <QuantityAdjustmentForm
            item={selectedItem}
            onClose={() => {
              setIsAdjustModalOpen(false)
              setSelectedItem(null)
            }}
            onSuccess={refreshData}
          />
        </Modal>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedItem(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Ítem de Inventario"
        message={`¿Está seguro que desea eliminar el ítem "${selectedItem?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}
