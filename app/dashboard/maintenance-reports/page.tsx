"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  getCostoPorEquipo,
  getCostoMensualPorArea,
  getHistorialMantenimientos,
  getRepuestosMasUtilizados,
  getComparativoPreventivosCorrectivos,
} from "@/app/actions/maintenance-reports"
import { useToast } from "@/hooks/use-toast"
import { ExportButtons } from "@/components/export-buttons"
import { prepareTableDataForExport } from "@/lib/export-utils"
import { BarChartCustom } from "@/components/bar-chart-custom"
import { LineChartCustom } from "@/components/line-chart-custom"
import { PieChartCustom } from "@/components/pie-chart-custom"

// Importar los formateadores
import { formatCurrency, formatDate } from "@/lib/formatters"

export default function MaintenanceReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [costoPorEquipo, setCostoPorEquipo] = useState<any[]>([])
  const [costoMensualPorArea, setCostoMensualPorArea] = useState<any[]>([])
  const [historialMantenimientos, setHistorialMantenimientos] = useState<any[]>([])
  const [repuestosMasUtilizados, setRepuestosMasUtilizados] = useState<any[]>([])
  const [comparativo, setComparativo] = useState<any>(null)

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHistorial, setFilteredHistorial] = useState<any[]>([])
  const [filteredRepuestos, setFilteredRepuestos] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costos, costosPorArea, historial, repuestos, comparativoData] = await Promise.all([
          getCostoPorEquipo(),
          getCostoMensualPorArea(),
          getHistorialMantenimientos(),
          getRepuestosMasUtilizados(),
          getComparativoPreventivosCorrectivos(),
        ])

        setCostoPorEquipo(costos)
        setCostoMensualPorArea(costosPorArea)
        setHistorialMantenimientos(historial)
        setFilteredHistorial(historial)
        setRepuestosMasUtilizados(repuestos)
        setFilteredRepuestos(repuestos)
        setComparativo(comparativoData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de informes.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filtrar historial de mantenimientos
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredHistorial(historialMantenimientos)
      setFilteredRepuestos(repuestosMasUtilizados)
      return
    }

    const query = searchQuery.toLowerCase()

    // Filtrar historial
    const filteredHistorial = historialMantenimientos.filter(
      (item) =>
        item.equipo.toLowerCase().includes(query) ||
        item.tipo.toLowerCase().includes(query) ||
        item.tecnico.toLowerCase().includes(query),
    )

    // Filtrar repuestos
    const filteredRepuestos = repuestosMasUtilizados.filter((item) => item.nombre.toLowerCase().includes(query))

    setFilteredHistorial(filteredHistorial)
    setFilteredRepuestos(filteredRepuestos)
  }, [searchQuery, historialMantenimientos, repuestosMasUtilizados])

  // Preparar datos para el gráfico de costo por equipo
  const datosCostoPorEquipo = costoPorEquipo.map((equipo) => ({
    name: equipo.equipoNombre,
    value: equipo.costoTotal,
  }))

  // Preparar datos para el gráfico de comparativo
  const datosComparativo = comparativo
    ? [
        {
          name: "Preventivos",
          cantidad: comparativo.resumen.preventivos.cantidad,
          costo: comparativo.resumen.preventivos.costoTotal,
        },
        {
          name: "Correctivos",
          cantidad: comparativo.resumen.correctivos.cantidad,
          costo: comparativo.resumen.correctivos.costoTotal,
        },
        {
          name: "Calibraciones",
          cantidad: comparativo.resumen.calibraciones.cantidad,
          costo: comparativo.resumen.calibraciones.costoTotal,
        },
      ]
    : []

  // Preparar datos para exportación
  const costoPorEquipoExport = prepareTableDataForExport(costoPorEquipo, {
    equipoNombre: "Equipo",
    ubicacion: "Ubicación",
    cantidadMantenimientos: "Cantidad Mantenimientos",
    costoTotal: "Costo Total",
  })

  const historialExport = prepareTableDataForExport(filteredHistorial, {
    equipo: "Equipo",
    tipo: "Tipo",
    fechaInicio: "Fecha",
    estado: "Estado",
    tecnico: "Técnico",
    costoTotal: "Costo Total",
  })

  const repuestosExport = prepareTableDataForExport(filteredRepuestos, {
    nombre: "Repuesto",
    cantidadTotal: "Cantidad Total",
    usos: "Usos",
    costoTotal: "Costo Total",
  })

  const comparativoExport = comparativo
    ? prepareTableDataForExport(
        [
          {
            tipo: "Preventivos",
            cantidad: comparativo.resumen.preventivos.cantidad,
            costoMantenimientos: comparativo.resumen.preventivos.costoMantenimientos,
            costoRepuestos: comparativo.resumen.preventivos.costoRepuestos,
            costoTotal: comparativo.resumen.preventivos.costoTotal,
          },
          {
            tipo: "Correctivos",
            cantidad: comparativo.resumen.correctivos.cantidad,
            costoMantenimientos: comparativo.resumen.correctivos.costoMantenimientos,
            costoRepuestos: comparativo.resumen.correctivos.costoRepuestos,
            costoTotal: comparativo.resumen.correctivos.costoTotal,
          },
          {
            tipo: "Calibraciones",
            cantidad: comparativo.resumen.calibraciones.cantidad,
            costoMantenimientos: comparativo.resumen.calibraciones.costoMantenimientos,
            costoRepuestos: comparativo.resumen.calibraciones.costoRepuestos,
            costoTotal: comparativo.resumen.calibraciones.costoTotal,
          },
        ],
        {
          tipo: "Tipo",
          cantidad: "Cantidad",
          costoMantenimientos: "Costo Mantenimientos",
          costoRepuestos: "Costo Repuestos",
          costoTotal: "Costo Total",
        },
      )
    : { headers: [], data: [] }

  // Formateador para valores monetarios
  // const formatCurrency = (value: number) =>
  //   new Intl.NumberFormat("es-ES", {
  //     style: "currency",
  //     currency: "USD",
  //   }).format(value)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-optilab-blue">Informes de Mantenimiento</h1>

      <Tabs defaultValue="costo-equipo">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="costo-equipo">Costo por Equipo</TabsTrigger>
          <TabsTrigger value="costo-area">Costo por Área</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="repuestos">Repuestos</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {/* Informe: Costo por Equipo */}
        <TabsContent value="costo-equipo" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Costo Total por Equipo</CardTitle>
                <CardDescription>Análisis de costos acumulados por equipo</CardDescription>
              </div>
              <ExportButtons
                title="Costo Total por Equipo"
                headers={costoPorEquipoExport.headers}
                data={costoPorEquipoExport.data}
                filename="costo_por_equipo"
                orientation="landscape"
                disabled={costoPorEquipo.length === 0}
              />
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <BarChartCustom
                  data={datosCostoPorEquipo}
                  dataKey="value"
                  nameKey="name"
                  xAxisLabel="Equipo"
                  yAxisLabel="Costo"
                  formatter={formatCurrency}
                  height={400}
                  layout="vertical"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Cantidad Mantenimientos</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costoPorEquipo.map((equipo, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{equipo.equipoNombre}</TableCell>
                      <TableCell>{equipo.ubicacion}</TableCell>
                      <TableCell>{equipo.cantidadMantenimientos}</TableCell>
                      <TableCell className="text-right">{formatCurrency(equipo.costoTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informe: Costo Mensual por Área */}
        <TabsContent value="costo-area" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Costo Mensual por Área</CardTitle>
              <CardDescription>Análisis de costos mensuales por área</CardDescription>
            </CardHeader>
            <CardContent>
              {costoMensualPorArea.map((area, index) => (
                <div key={index} className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">{area.area}</h3>
                    <ExportButtons
                      title={`Costo Mensual - ${area.area}`}
                      headers={["Mes", "Costo"]}
                      data={area.datos}
                      filename={`costo_mensual_${area.area.toLowerCase().replace(/\s+/g, "_")}`}
                      disabled={area.datos.length === 0}
                    />
                  </div>
                  <div className="h-[250px]">
                    <LineChartCustom
                      data={area.datos}
                      lines={[{ dataKey: "costo", color: "#003366", name: "Costo" }]}
                      nameKey="mes"
                      xAxisLabel="Mes"
                      yAxisLabel="Costo"
                      formatter={formatCurrency}
                      height={250}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informe: Historial de Mantenimientos */}
        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Mantenimientos</CardTitle>
                <CardDescription>Registro completo de mantenimientos realizados</CardDescription>
              </div>
              <ExportButtons
                title="Historial de Mantenimientos"
                headers={historialExport.headers}
                data={historialExport.data}
                filename="historial_mantenimientos"
                orientation="landscape"
                disabled={filteredHistorial.length === 0}
              />
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por equipo, tipo o técnico..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorial.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No se encontraron registros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistorial.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.equipo}</TableCell>
                          <TableCell>{item.tipo}</TableCell>
                          <TableCell>{formatDate(item.fechaInicio)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                item.estado === "Completado"
                                  ? "bg-green-100 text-green-800"
                                  : item.estado === "En proceso"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.estado === "Programado"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.estado}
                            </span>
                          </TableCell>
                          <TableCell>{item.tecnico}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.costoTotal)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informe: Repuestos Más Utilizados */}
        <TabsContent value="repuestos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Repuestos Más Utilizados</CardTitle>
                <CardDescription>Análisis de consumo de repuestos en mantenimientos</CardDescription>
              </div>
              <ExportButtons
                title="Repuestos Más Utilizados"
                headers={repuestosExport.headers}
                data={repuestosExport.data}
                filename="repuestos_utilizados"
                disabled={filteredRepuestos.length === 0}
              />
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar repuesto..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <BarChartCustom
                  data={filteredRepuestos.slice(0, 10)}
                  dataKey="cantidadTotal"
                  nameKey="nombre"
                  xAxisLabel="Repuesto"
                  yAxisLabel="Cantidad"
                  height={400}
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repuesto</TableHead>
                      <TableHead>Cantidad Total</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepuestos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No se encontraron registros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRepuestos.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.nombre}</TableCell>
                          <TableCell>{item.cantidadTotal}</TableCell>
                          <TableCell>{item.usos}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.costoTotal)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informe: Comparativo Preventivo vs Correctivo */}
        <TabsContent value="comparativo" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comparativo: Preventivo vs Correctivo</CardTitle>
                <CardDescription>Análisis comparativo entre tipos de mantenimiento</CardDescription>
              </div>
              <ExportButtons
                title="Comparativo: Preventivo vs Correctivo"
                headers={comparativoExport.headers}
                data={comparativoExport.data}
                filename="comparativo_mantenimientos"
                disabled={!comparativo}
              />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-lg font-medium">Distribución por Cantidad</h3>
                  <PieChartCustom data={datosComparativo} dataKey="cantidad" height={300} />
                </div>
                <div>
                  <h3 className="mb-4 text-lg font-medium">Distribución por Costo</h3>
                  <PieChartCustom
                    data={datosComparativo}
                    dataKey="costo"
                    formatter={formatCurrency}
                    height={300}
                    colorOffset={1}
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-medium">Tendencia Mensual</h3>
                <LineChartCustom
                  data={comparativo ? comparativo.tendenciaMensual : []}
                  lines={[
                    { dataKey: "preventivos", color: "#003366", name: "Preventivos" },
                    { dataKey: "correctivos", color: "#ff3333", name: "Correctivos" },
                  ]}
                  nameKey="mes"
                  xAxisLabel="Mes"
                  yAxisLabel="Cantidad"
                  height={300}
                />
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-medium">Resumen Comparativo</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Mantenimientos</TableHead>
                      <TableHead>Costo Repuestos</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparativo ? (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">Preventivos</TableCell>
                          <TableCell>{comparativo.resumen.preventivos.cantidad}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.preventivos.costoMantenimientos)}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.preventivos.costoRepuestos)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(comparativo.resumen.preventivos.costoTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Correctivos</TableCell>
                          <TableCell>{comparativo.resumen.correctivos.cantidad}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.correctivos.costoMantenimientos)}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.correctivos.costoRepuestos)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(comparativo.resumen.correctivos.costoTotal)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Calibraciones</TableCell>
                          <TableCell>{comparativo.resumen.calibraciones.cantidad}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.calibraciones.costoMantenimientos)}</TableCell>
                          <TableCell>{formatCurrency(comparativo.resumen.calibraciones.costoRepuestos)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(comparativo.resumen.calibraciones.costoTotal)}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay datos disponibles.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
