"use client"

import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { FirebaseInitializer } from "@/components/firebase-initializer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FirebaseInitializer />
      {children}
    </AuthProvider>
  )
}
