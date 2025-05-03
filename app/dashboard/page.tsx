"use client"

import { useAuthRequired } from "@/hooks/use-auth-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading } = useAuthRequired()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bienvenido, {user?.displayName || user?.email?.split("@")[0] || "Usuario"}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inventario</CardDescription>
            <CardTitle className="text-2xl">128 items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+2.5% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Máquinas</CardDescription>
            <CardTitle className="text-2xl">24 activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">98% de disponibilidad</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mantenimientos</CardDescription>
            <CardTitle className="text-2xl">6 pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Próximo: en 2 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reportes</CardDescription>
            <CardTitle className="text-2xl">15 nuevos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">3 requieren atención</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
