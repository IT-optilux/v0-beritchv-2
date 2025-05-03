"use client"

import { useState, useEffect } from "react"
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase-client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [userName, setUserName] = useState("Usuario")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Obtener información del usuario actual
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "Usuario")
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      // Llamar a la API para eliminar la cookie de sesión
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Cerrar sesión en Firebase
      await auth.signOut()

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })

      // Redirigir al login
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100">
          <Bell className="h-6 w-6" />
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-optilab-blue text-white">
              <User className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">{userName}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
