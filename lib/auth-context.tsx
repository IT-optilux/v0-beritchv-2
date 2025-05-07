"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase-client"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  authError: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {}
    }

    // Esperar a que auth esté disponible
    if (!auth) {
      const checkAuthInterval = setInterval(() => {
        if (auth) {
          clearInterval(checkAuthInterval)
          setupAuthListener()
        }
      }, 500)

      // Limpiar intervalo después de 10 segundos si auth no está disponible
      setTimeout(() => {
        clearInterval(checkAuthInterval)
        if (!auth) {
          console.error("Auth no disponible después de 10 segundos")
          setLoading(false)
          setAuthError("No se pudo inicializar la autenticación")
        }
      }, 10000)

      return () => clearInterval(checkAuthInterval)
    } else {
      return setupAuthListener()
    }

    function setupAuthListener() {
      try {
        console.log("Configurando listener de autenticación")
        const unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            console.log("Estado de autenticación cambiado:", firebaseUser ? "Usuario autenticado" : "No hay usuario")

            if (firebaseUser) {
              setUser(firebaseUser)
              try {
                const idTokenResult = await firebaseUser.getIdTokenResult()
                setIsAdmin(idTokenResult.claims.role === "admin")
              } catch (error) {
                console.error("Error al verificar rol de administrador:", error)
                setIsAdmin(false)
              }
            } else {
              setUser(null)
              setIsAdmin(false)

              // Redirigir solo si estamos en una ruta protegida
              const isProtectedRoute = pathname?.startsWith("/dashboard")
              if (isProtectedRoute) {
                router.push(`/login?redirect=${pathname}`)
              }
            }

            setLoading(false)
            setAuthError(null)
          },
          (error) => {
            console.error("Error en el listener de autenticación:", error)
            setAuthError("Error al monitorear el estado de autenticación")
            setLoading(false)
          },
        )

        return unsubscribe
      } catch (error) {
        console.error("Error al configurar listener de autenticación:", error)
        setAuthError("Error al configurar la autenticación")
        setLoading(false)
        return () => {}
      }
    }
  }, [router, pathname])

  return <AuthContext.Provider value={{ user, loading, isAdmin, authError }}>{children}</AuthContext.Provider>
}
