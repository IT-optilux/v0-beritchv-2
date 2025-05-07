"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onSnapshot, collection, doc } from "firebase/firestore"
import { firestore, isFirebaseInitialized } from "@/lib/firebase-client"

type ConnectionState = {
  isOnline: boolean
  firestoreConnected: boolean
  lastSyncTime: Date | null
  syncStatus: "synced" | "syncing" | "error" | "offline"
}

type ConnectionContextType = ConnectionState & {
  checkConnection: () => Promise<boolean>
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectionState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    firestoreConnected: false,
    lastSyncTime: null,
    syncStatus: "syncing",
  })

  const checkConnection = async (): Promise<boolean> => {
    if (!isFirebaseInitialized() || !firestore) {
      setState((prev) => ({ ...prev, firestoreConnected: false, syncStatus: "error" }))
      return false
    }

    try {
      // Intentar una operación simple para verificar la conexión
      const testDoc = doc(firestore, "__connectionTest__/test")
      await onSnapshot(testDoc, () => {
        setState((prev) => ({
          ...prev,
          firestoreConnected: true,
          lastSyncTime: new Date(),
          syncStatus: "synced",
        }))
      })
      return true
    } catch (error) {
      console.error("Error al verificar conexión:", error)
      setState((prev) => ({ ...prev, firestoreConnected: false, syncStatus: "error" }))
      return false
    }
  }

  // Monitorear conexión a internet
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true, syncStatus: "syncing" }))
      checkConnection()
    }

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false, syncStatus: "offline" }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Estado inicial
    setState((prev) => ({ ...prev, isOnline: navigator.onLine }))

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Monitorear conexión a Firestore
  useEffect(() => {
    if (!firestore || !state.isOnline) return

    try {
      // Intentar establecer una conexión a Firestore
      const unsubscribe = onSnapshot(
        collection(firestore, "__connectionTest__"),
        () => {
          setState((prev) => ({
            ...prev,
            firestoreConnected: true,
            lastSyncTime: new Date(),
            syncStatus: "synced",
          }))
        },
        (error) => {
          console.error("Error de conexión a Firestore:", error)
          setState((prev) => ({ ...prev, firestoreConnected: false, syncStatus: "error" }))
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error al monitorear conexión a Firestore:", error)
      setState((prev) => ({ ...prev, firestoreConnected: false, syncStatus: "error" }))
      return () => {}
    }
  }, [state.isOnline])

  return <ConnectionContext.Provider value={{ ...state, checkConnection }}>{children}</ConnectionContext.Provider>
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error("useConnection debe ser usado dentro de un ConnectionProvider")
  }
  return context
}
