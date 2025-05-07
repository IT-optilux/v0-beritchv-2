"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { firestore, isFirebaseInitialized } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function TestConnectionPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [testResults, setTestResults] = useState<Array<{ name: string; status: "success" | "error"; message: string }>>(
    [],
  )
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setIsInitialized(isFirebaseInitialized())
  }, [])

  const runTest = async () => {
    setStatus("loading")
    setMessage("Ejecutando pruebas de conexión...")
    setTestResults([])

    const results = []

    // Prueba 1: Verificar inicialización
    if (!isFirebaseInitialized() || !firestore) {
      results.push({
        name: "Inicialización de Firebase",
        status: "error" as const,
        message: "Firebase no está inicializado correctamente",
      })
      setStatus("error")
      setMessage("Firebase no está inicializado correctamente")
      setTestResults(results)
      return
    } else {
      results.push({
        name: "Inicialización de Firebase",
        status: "success" as const,
        message: "Firebase inicializado correctamente",
      })
    }

    // Prueba 2: Escribir en Firestore
    try {
      const testCollection = collection(firestore, "connectionTest")
      const docRef = await addDoc(testCollection, {
        timestamp: Timestamp.now(),
        message: "Test de conexión",
      })

      results.push({
        name: "Escritura en Firestore",
        status: "success" as const,
        message: `Documento creado con ID: ${docRef.id}`,
      })
    } catch (error: any) {
      results.push({
        name: "Escritura en Firestore",
        status: "error" as const,
        message: `Error al escribir en Firestore: ${error.message}`,
      })
    }

    // Prueba 3: Leer de Firestore
    try {
      const testCollection = collection(firestore, "connectionTest")
      const querySnapshot = await getDocs(testCollection)

      results.push({
        name: "Lectura de Firestore",
        status: "success" as const,
        message: `Leídos ${querySnapshot.size} documentos`,
      })
    } catch (error: any) {
      results.push({
        name: "Lectura de Firestore",
        status: "error" as const,
        message: `Error al leer de Firestore: ${error.message}`,
      })
    }

    // Determinar estado general
    const hasErrors = results.some((result) => result.status === "error")
    setStatus(hasErrors ? "error" : "success")
    setMessage(hasErrors ? "Hay problemas con la conexión a Firebase" : "Conexión a Firebase establecida correctamente")
    setTestResults(results)
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Conexión a Firebase</CardTitle>
          <CardDescription>Verifica la conexión con los servicios de Firebase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Estado de inicialización:</span>
              {isInitialized ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Inicializado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  No inicializado
                </Badge>
              )}
            </div>

            {status !== "idle" && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Estado de la prueba:</span>
                  {status === "loading" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Ejecutando
                    </Badge>
                  )}
                  {status === "success" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exitoso
                    </Badge>
                  )}
                  {status === "error" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
              </div>
            )}

            {testResults.length > 0 && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">Resultados detallados</h3>
                </div>
                <div className="divide-y">
                  {testResults.map((result, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.name}</span>
                        {result.status === "success" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exitoso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={runTest} disabled={status === "loading" || !isInitialized} className="w-full">
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ejecutar prueba de conexión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
