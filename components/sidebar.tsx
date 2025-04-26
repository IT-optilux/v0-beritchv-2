"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Clipboard,
  Home,
  Layers,
  Package,
  Settings,
  PenToolIcon as Tool,
  Users,
  FileText,
  Wrench,
  LineChart,
  PieChart,
} from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

const menuItems = [
  { name: "Inicio", href: "/dashboard", icon: Home },
  { name: "Máquinas/Equipos", href: "/dashboard/machines", icon: Tool },
  { name: "Mantenimiento", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Panel Mantenimiento", href: "/dashboard/maintenance-dashboard", icon: PieChart },
  { name: "Informes Mantenimiento", href: "/dashboard/maintenance-reports", icon: LineChart },
  { name: "Reportes", href: "/dashboard/reports", icon: Clipboard },
  { name: "Inventario", href: "/dashboard/inventory", icon: Package },
  { name: "Registro de Uso", href: "/dashboard/usage-logs", icon: FileText },
  { name: "Informes", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Usuarios", href: "/dashboard/users", icon: Users },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn("flex h-full flex-col border-r bg-white transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      <div className="flex h-16 items-center justify-center border-b px-4">
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-optilab-light">
            <span className="text-lg font-bold text-white">B</span>
          </div>
        ) : (
          <Image src="/images/logo.png" alt="Beritch By Optilab Logo" width={180} height={40} />
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-optilab-blue text-white" : "text-gray-700 hover:bg-gray-100",
                collapsed && "justify-center",
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <Layers className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}
