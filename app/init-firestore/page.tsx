"use client"

import { useState } from "react"
import { initializeFirestoreSchema, createInitialAdminUser } from "@/lib/firestore-init"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function InitFirestorePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")

  const handleInitialize = async () => {
    try {
      setStatus("loading")
      setMessage("Inicializando estructura de Firestore...")

      await initializeFirestoreSchema()

      setMessage("Estructura de Firestore inicializada correctamente")
      setStatus("success")
    } catch (error) {
      console.error("Error al inicializar Firestore:", error)
      setMessage(`Error al inicializar Firestore: ${error instanceof Error ? error.message : String(error)}`)
      setStatus("error")
    }
  }

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminName) {
      setMessage("Por favor, ingresa el email y nombre del administrador")
      setStatus("error")
      return
    }

    try {
      setStatus("loading")
      setMessage("Creando usuario administrador...")

      await createInitialAdminUser(adminEmail, adminName)

      setMessage("Usuario administrador creado correctamente")
      setStatus("success")
    } catch (error) {
      console.error("Error al crear usuario administrador:", error)
      setMessage(`Error al crear usuario administrador: ${error instanceof Error ? error.message : String(error)}`)
      setStatus("error")
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Inicialización de Firestore</CardTitle>
          <CardDescription>Configura la estructura de datos en Firestore para tu aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Inicializar Estructura</h3>
            <p className="text-sm text-gray-500 mb-4">
              Este proceso creará las colecciones necesarias en Firestore para tu aplicación.
            </p>
            <Button onClick={handleInitialize} disabled={status === "loading"} className="w-full">
              {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inicializar Estructura de Firestore
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Crear Usuario Administrador</h3>
            <p className="text-sm text-gray-500 mb-4">Crea un usuario administrador inicial si no existe ninguno.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email del Administrador</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Nombre del Administrador</Label>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Nombre Completo"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateAdmin}
                disabled={status === "loading" || !adminEmail || !adminName}
                className="w-full"
              >
                {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario Administrador
              </Button>
            </div>
          </div>

          {status !== "idle" && (
            <div className="mt-4 p-4 rounded-md border">
              <div className="flex items-center gap-2">
                {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                <p
                  className={`text-sm ${
                    status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {message}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-gray-500">
            Nota: Este proceso solo debe ejecutarse una vez al configurar la aplicación.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
