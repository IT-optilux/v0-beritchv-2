"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado en Firebase
        setUser(firebaseUser)

        // Verificar si el usuario es administrador
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult()
          setIsAdmin(idTokenResult.claims.role === "admin")
        } catch (error) {
          console.error("Error al verificar rol de administrador:", error)
          setIsAdmin(false)
        }
      } else {
        // No hay usuario autenticado
        setUser(null)
        setIsAdmin(false)

        // Si estamos en una ruta protegida, redirigir al login
        const isProtectedRoute = pathname?.startsWith("/dashboard")
        if (isProtectedRoute) {
          router.push(`/login?redirect=${pathname}`)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, pathname])

  return <AuthContext.Provider value={{ user, loading, isAdmin }}>{children}</AuthContext.Provider>
}
