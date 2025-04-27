"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { Machine } from "@/types"
import { getMachines, deleteMachine } from "@/app/actions/machines"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MachineForm } from "@/components/machines/machine-form"
import { useToast } from "@/hooks/use-toast"

export default function MachinesPage() {
  const { toast } = useToast()
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getMachines()
        setMachines(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los equipos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMachines()
  }, [toast])

  const handleEdit = (machine: Machine) => {
    setSelectedMachine(machine)
    setIsEditModalOpen(true)
  }

  const handleDelete = (machine: Machine) => {
    setSelectedMachine(machine)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedMachine) return

    setIsDeleting(true)
    try {
      const result = await deleteMachine(selectedMachine.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setMachines(machines.filter((m) => m.id !== selectedMachine.id))
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
        description: "Ha ocurrido un error al eliminar el equipo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedMachine(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getMachines()
      setMachines(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Máquinas y Equipos</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Equipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Equipos</CardTitle>
          <CardDescription>Gestione todos los equipos del laboratorio óptico</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Número de Serie</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Mantenimiento</TableHead>
                  <TableHead>Próximo Mantenimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay equipos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.name}</TableCell>
                      <TableCell>{machine.model}</TableCell>
                      <TableCell>{machine.serialNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            machine.status === "Operativa"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : machine.status === "Mantenimiento"
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-red-500 bg-red-50 text-red-700"
                          }
                        >
                          {machine.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(machine.lastMaintenance).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(machine.nextMaintenance).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(machine)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-optilab-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(machine)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Link
                            href={`/dashboard/machines/${machine.id}`}
                            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-optilab-blue hover:bg-gray-100"
                          >
                            Ver detalles
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

      {/* Modal para agregar equipo */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Nuevo Equipo" size="lg">
        <MachineForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar equipo */}
      {selectedMachine && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedMachine(null)
          }}
          title="Editar Equipo"
          size="lg"
        >
          <MachineForm
            machine={selectedMachine}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedMachine(null)
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
          setSelectedMachine(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Equipo"
        message={`¿Está seguro que desea eliminar el equipo "${selectedMachine?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}




