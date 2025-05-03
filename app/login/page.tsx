import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Lado izquierdo - Imagen/Logo */}
      <div className="flex flex-1 items-center justify-center bg-optilab-blue p-8">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <Image src="/images/logo.png" alt="Beritch Optilab Logo" width={150} height={150} />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Sistema de Gestión BERITCHV2</h1>
          <p className="text-lg text-white/80">
            Plataforma integral para la gestión de inventario, mantenimiento y reportes.
          </p>
        </div>
      </div>

      {/* Lado derecho - Formulario de login */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
            <p className="mt-2 text-gray-600">Ingrese sus credenciales para acceder al sistema</p>
          </div>
          <LoginForm />
          <div className="text-center text-sm text-gray-500">
            <p>
              ¿Problemas para acceder?{" "}
              <Link href="/contact" className="font-medium text-optilab-blue hover:underline">
                Contacte al administrador
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
