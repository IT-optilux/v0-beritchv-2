import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { InitFirebase } from "./init-firebase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beritch - Sistema de Gestión de Laboratorio",
  description: "Sistema de gestión para laboratorios ópticos",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <InitFirebase />
          {children}
        </Providers>
      </body>
    </html>
  )
}
