"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado en Firebase
        setUser(firebaseUser)
      } else {
        // No hay usuario autenticado en Firebase
        setUser(null)

        // Verificar si hay una cookie de sesión válida
        try {
          const response = await fetch("/api/auth/verify-session")
          const data = await response.json()

          if (!data.authenticated) {
            // Si no hay sesión válida y estamos en una ruta protegida, redirigir al login
            const isProtectedRoute = window.location.pathname.startsWith("/dashboard")
            if (isProtectedRoute) {
              router.push(`/login?redirect=${window.location.pathname}`)
            }
          }
        } catch (error) {
          console.error("Error al verificar sesión:", error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
