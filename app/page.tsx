import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import Image from "next/image"

// Componente que usa useSearchParams (si es necesario)
function SearchParamsComponent() {
  "use client"
  return null // Este componente no hace nada, solo está aquí para la estructura
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-optilab-blue to-optilab-blue/90">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <Image src="/images/logo.png" alt="Beritch By Optilab Logo" width={300} height={100} className="mb-6" />
          <h2 className="text-2xl font-bold text-optilab-blue">Sistema de Gestión de Laboratorio</h2>
        </div>
        <Suspense fallback={<div>Cargando...</div>}>
          <LoginForm />
          <SearchParamsComponent />
        </Suspense>
      </div>
    </div>
  )
}
