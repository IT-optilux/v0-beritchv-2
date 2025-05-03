"use client"

import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import dynamic from "next/dynamic"

// Importar dinámicamente para asegurar que solo se ejecuta en el cliente
const ClientOnlyFirebaseInitializer = dynamic(
  () => import("@/components/firebase-initializer").then((mod) => mod.FirebaseInitializer),
  { ssr: false },
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientOnlyFirebaseInitializer />
      <AuthProvider>{children}</AuthProvider>
    </>
  )
}
