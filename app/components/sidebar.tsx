"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  Cog,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  PenToolIcon as Tool,
  Truck,
  Wrench,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verificar si el usuario es administrador
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/check-admin")
        const data = await response.json()
        setIsAdmin(data.isAdmin)
      } catch (error) {
        console.error("Error al verificar permisos de administrador:", error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Máquinas",
      href: "/dashboard/machines",
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      title: "Inventario",
      href: "/dashboard/inventory",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Mantenimiento",
      href: "/dashboard/maintenance",
      icon: <Tool className="h-5 w-5" />,
    },
    {
      title: "Registros de Uso",
      href: "/dashboard/usage-logs",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "Reportes",
      href: "/dashboard/reports",
      icon: <Truck className="h-5 w-5" />,
    },
  ]

  // Agregar el enlace de Usuarios solo si el usuario es administrador
  if (isAdmin) {
    mainNavItems.push({
      title: "Usuarios",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />,
    })
  }

  const secondaryNavItems = [
    {
      title: "Análisis",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Configuración",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className={cn("flex h-full flex-col border-r bg-white transition-all", expanded ? "w-64" : "w-16", className)}>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-optilab-blue text-white">
            <Home className="h-5 w-5" />
          </div>
          {expanded && <span className="text-lg font-semibold">BERITCHV2</span>}
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto rounded-lg p-1 hover:bg-gray-100"
          aria-label={expanded ? "Contraer menú" : "Expandir menú"}
        >
          <Cog className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
                pathname === item.href && "bg-gray-100 text-gray-900",
                !expanded && "justify-center",
              )}
            >
              {item.icon}
              {expanded && <span>{item.title}</span>}
            </Link>
          ))}
          <div className="my-2 h-px bg-gray-200" />
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
                pathname === item.href && "bg-gray-100 text-gray-900",
                !expanded && "justify-center",
              )}
            >
              {item.icon}
              {expanded && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
