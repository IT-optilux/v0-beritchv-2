"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div className="p-4">Ha ocurrido un error en la aplicación. Por favor, recarga la página.</div>}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
