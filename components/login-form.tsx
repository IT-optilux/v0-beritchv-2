"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get("redirect") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Iniciar sesión con Firebase
      await signInWithEmailAndPassword(auth, email, password).catch((firebaseError) => {
        console.error("Firebase authentication error:", firebaseError)

        // Manejar errores específicos de Firebase Auth
        if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/wrong-password") {
          throw new Error("Credenciales inválidas. Por favor, verifique su email y contraseña.")
        } else if (firebaseError.code === "auth/too-many-requests") {
          throw new Error("Demasiados intentos fallidos. Por favor, inténtelo más tarde.")
        } else {
          throw new Error("Error al iniciar sesión con Firebase: " + firebaseError.message)
        }
      })

      // Inicio de sesión exitoso
      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al dashboard...",
      })

      // Redirigir al usuario
      router.push(redirectUrl)
    } catch (error: any) {
      console.error("Login error:", error)

      // Mostrar el error en la interfaz
      setError(error.message || "Error al iniciar sesión. Por favor, inténtelo de nuevo.")

      toast({
        title: "Error de autenticación",
        description: error.message || "No se pudo iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
        <p className="text-gray-500">Ingrese sus credenciales para acceder al sistema</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="ejemplo@beritchoptilab.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              ¿Olvidó su contraseña?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full bg-optilab-blue hover:bg-optilab-blue/90" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </div>
  )
}
