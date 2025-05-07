"use client"

import { useEffect, useState } from "react"
import { firestore, auth, storage, database, analytics, isFirebaseInitialized } from "@/lib/firebase-client"
import { collection, getDocs } from "firebase/firestore"

export default function TestFirebasePage() {
  const [status, setStatus] = useState({
    initialized: false,
    firestoreConnected: false,
    authConnected: false,
    storageConnected: false,
    databaseConnected: false,
    analyticsConnected: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkFirebase() {
      try {
        // Verificar inicialización
        const initialized = isFirebaseInitialized()

        // Verificar Firestore
        let firestoreConnected = false
        if (firestore) {
          try {
            const querySnapshot = await getDocs(collection(firestore, "test-collection"))
            firestoreConnected = true
          } catch (err) {
            console.error("Error al conectar con Firestore:", err)
          }
        }

        // Actualizar estado
        setStatus({
          initialized,
          firestoreConnected,
          authConnected: !!auth,
          storageConnected: !!storage,
          databaseConnected: !!database,
          analyticsConnected: !!analytics,
        })
      } catch (err) {
        console.error("Error al verificar Firebase:", err)
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    checkFirebase()
  }, [])

  if (loading) {
    return <div className="p-8">Verificando conexión a Firebase...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Estado de Firebase</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <StatusItem title="Firebase Inicializado" status={status.initialized} />
        <StatusItem title="Conexión a Firestore" status={status.firestoreConnected} />
        <StatusItem title="Conexión a Authentication" status={status.authConnected} />
        <StatusItem title="Conexión a Storage" status={status.storageConnected} />
        <StatusItem title="Conexión a Realtime Database" status={status.databaseConnected} />
        <StatusItem title="Conexión a Analytics" status={status.analyticsConnected} />
      </div>
    </div>
  )
}

function StatusItem({ title, status }: { title: string; status: boolean }) {
  return (
    <div className="flex items-center p-4 border rounded">
      <div className={`w-4 h-4 rounded-full mr-3 ${status ? "bg-green-500" : "bg-red-500"}`}></div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className={status ? "text-green-600" : "text-red-600"}>{status ? "Conectado" : "No conectado"}</p>
      </div>
    </div>
  )
}
