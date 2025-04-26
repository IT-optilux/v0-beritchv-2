"use client"

import { useState } from "react"
import type { Machine, MachinePart } from "@/types"
import { Plus, AlertTriangle, Settings, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MachinePartForm } from "@/components/machines/machine-part-form"
import { UsageUpdateForm } from "@/components/machines/usage-update-form"
import { PartReplacementForm } from "@/components/machines/part-replacement-form"
import { Progress } from "@/components/ui/progress"
import { deleteMachinePart } from "@/app/actions/machines"
import { useToast } from "@/hooks/use-toast"

interface MachinePartsTabProps {
  machine: Machine
  parts: MachinePart[]
  onPartsChange: () => void
}

export function MachinePartsTab({ machine, parts, onPartsChange }: MachinePartsTabProps) {
  const { toast } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false)
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<MachinePart | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpdateUsage = (part: MachinePart) => {
    setSelectedPart(part)
    setIsUsageModalOpen(true)
  }

  const handleReplacePart = (part: MachinePart) => {
    setSelectedPart(part)
    setIsReplaceModalOpen(true)
  }

  const handleDeletePart = (part: MachinePart) => {
    setSelectedPart(part)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePart = async () => {
    if (!selectedPart) return

    setIsProcessing(true)
    try {
      const result = await deleteMachinePart(selectedPart.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        onPartsChange()
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
        description: "Ha ocurrido un error al eliminar la pieza.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedPart(null)
    }
  }

  const getStatusColor = (part: MachinePart) => {
    const usagePercentage = (part.currentUsage / part.maxUsage) * 100
    if (usagePercentage >= 100) return "text-red-500"
    if (usagePercentage >= 75) return "text-amber-500"
    return "text-green-500"
  }

  const getProgressColor = (part: MachinePart) => {
    const usagePercentage = (part.currentUsage / part.maxUsage) * 100
    if (usagePercentage >= 100) return "bg-red-500"
    if (usagePercentage >= 75) return "bg-amber-500"
    return "bg-green-500"
  }

  const getProgressBgColor = (part: MachinePart) => {
    const usagePercentage = (part.currentUsage / part.maxUsage) * 100
    if (usagePercentage >= 100) return "bg-red-100"
    if (usagePercentage >= 75) return "bg-amber-100"
    return "bg-green-100"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Piezas de Desgaste</h3>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-optilab-blue hover:bg-optilab-blue/90">
          <Plus className="mr-2 h-4 w-4" />
          Añadir Pieza
        </Button>
      </div>

      {parts.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center text-center">
            <p className="text-gray-500">No hay piezas de desgaste registradas para este equipo.</p>
            <Button variant="link" onClick={() => setIsAddModalOpen(true)} className="mt-2 text-optilab-blue">
              Añadir una pieza de desgaste
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {parts.map((part) => {
            const usagePercentage = (part.currentUsage / part.maxUsage) * 100
            const remainingUsage = part.maxUsage - part.currentUsage
            const isWarning = usagePercentage >= 75 && usagePercentage < 100
            const isCritical = usagePercentage >= 100

            return (
              <Card key={part.id} className={`${isCritical ? "border-red-300" : isWarning ? "border-amber-300" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{part.name}</CardTitle>
                    {isCritical && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  </div>
                  <CardDescription>Instalada el {new Date(part.installationDate).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Uso: {part.currentUsage} de {part.maxUsage} {part.usageType}
                      </span>
                      <span className={`font-medium ${getStatusColor(part)}`}>{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={usagePercentage}
                      className={`h-2 ${getProgressBgColor(part)}`}
                      indicatorClassName={getProgressColor(part)}
                    />
                    <p className="text-xs text-gray-500">
                      {remainingUsage > 0
                        ? `Restante: ${remainingUsage} ${part.usageType}`
                        : "¡Pieza agotada! Se recomienda reemplazo inmediato"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateUsage(part)} className="flex-1">
                      <Settings className="mr-1 h-3 w-3" />
                      Registrar Uso
                    </Button>
                    <Button
                      variant={isCritical ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleReplacePart(part)}
                      className="flex-1"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Reemplazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal para añadir pieza */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Añadir Pieza de Desgaste"
        size="lg"
      >
        <MachinePartForm
          machineId={machine.id}
          machineName={machine.name}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={onPartsChange}
        />
      </Modal>

      {/* Modal para actualizar uso */}
      {selectedPart && (
        <Modal
          isOpen={isUsageModalOpen}
          onClose={() => {
            setIsUsageModalOpen(false)
            setSelectedPart(null)
          }}
          title="Registrar Uso"
          size="sm"
        >
          <UsageUpdateForm
            part={selectedPart}
            onClose={() => {
              setIsUsageModalOpen(false)
              setSelectedPart(null)
            }}
            onSuccess={onPartsChange}
          />
        </Modal>
      )}

      {/* Modal para reemplazar pieza */}
      {selectedPart && (
        <Modal
          isOpen={isReplaceModalOpen}
          onClose={() => {
            setIsReplaceModalOpen(false)
            setSelectedPart(null)
          }}
          title="Reemplazar Pieza"
          size="md"
        >
          <PartReplacementForm
            part={selectedPart}
            onClose={() => {
              setIsReplaceModalOpen(false)
              setSelectedPart(null)
            }}
            onSuccess={onPartsChange}
          />
        </Modal>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedPart(null)
        }}
        onConfirm={confirmDeletePart}
        title="Eliminar Pieza"
        message={`¿Está seguro que desea eliminar la pieza "${selectedPart?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isProcessing}
      />
    </div>
  )
}
