"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { machineService } from "@/lib/firebase-services"
import type { Machine } from "@/types"
import { useToast } from "@/hooks/use-toast"

export default function NewMaintenancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true)
        const data = await machineService.getAll()
        setMachines(data)

        // Check if machineId is provided in URL
        const machineId = searchParams.get("machineId")
        if (machineId) {
          setSelectedMachineId(machineId)
        }
      } catch (error) {
        console.error("Error fetching machines:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los equipos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMachines()
  }, [searchParams, toast])

  const handleSuccess = () => {
    toast({
      title: "Éxito",
      description: "Mantenimiento programado correctamente",
    })
    router.push("/dashboard/maintenance")
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-optilab-blue">Programar Mantenimiento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Mantenimiento</CardTitle>
          <CardDescription>Programa un mantenimiento para un equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceForm
            machines={machines}
            initialMachineId={selectedMachineId}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  )
}
