"use server"

import { getMaintenances, getMaintenancePartsByMaintenanceId } from "@/app/actions/maintenance"
import { getMachines } from "@/app/actions/machines"
import { getInventoryItems } from "@/app/actions/inventory"
import type { Maintenance, MaintenancePart } from "@/types"

// Función para obtener el costo total por equipo
export async function getCostoPorEquipo() {
  const maintenances = await getMaintenances()
  const machines = await getMachines()

  // Agrupar mantenimientos por equipo y sumar costos
  const costoPorEquipo = machines.map(async (machine) => {
    const mantenimientosEquipo = maintenances.filter((m) => m.machineId === machine.id)

    // Calcular costo total de mantenimientos
    const costoMantenimientos = mantenimientosEquipo.reduce((total, m) => total + (m.cost || 0), 0)

    // Calcular costo total de repuestos
    let costoRepuestos = 0
    for (const mantenimiento of mantenimientosEquipo) {
      const repuestos = await getMaintenancePartsByMaintenanceId(mantenimiento.id)
      costoRepuestos += repuestos.reduce((total, r) => total + r.total_costo, 0)
    }

    return {
      equipoId: machine.id,
      equipoNombre: machine.name,
      costoTotal: costoMantenimientos + costoRepuestos,
      cantidadMantenimientos: mantenimientosEquipo.length,
      ubicacion: machine.location || "No especificada",
    }
  })

  return Promise.all(costoPorEquipo)
}

// Función para obtener el costo mensual por área
export async function getCostoMensualPorArea() {
  const maintenances = await getMaintenances()
  const machines = await getMachines()

  // Crear mapa de equipos por ubicación
  const equiposPorUbicacion = new Map<string, number[]>()
  machines.forEach((machine) => {
    const ubicacion = machine.location || "No especificada"
    if (!equiposPorUbicacion.has(ubicacion)) {
      equiposPorUbicacion.set(ubicacion, [])
    }
    equiposPorUbicacion.get(ubicacion)?.push(machine.id)
  })

  // Obtener los últimos 6 meses
  const meses = []
  const hoy = new Date()
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push({
      nombre: fecha.toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      mes: fecha.getMonth(),
      año: fecha.getFullYear(),
    })
  }

  // Calcular costos por área y mes
  const resultado = []

  for (const [area, equiposIds] of equiposPorUbicacion.entries()) {
    const datosPorMes = meses.map((mes) => {
      // Filtrar mantenimientos por mes y equipos del área
      const mantenimientosMes = maintenances.filter((m) => {
        const fechaMantenimiento = new Date(m.startDate)
        return (
          fechaMantenimiento.getMonth() === mes.mes &&
          fechaMantenimiento.getFullYear() === mes.año &&
          equiposIds.includes(m.machineId)
        )
      })

      // Calcular costo total
      const costoMantenimientos = mantenimientosMes.reduce((total, m) => total + (m.cost || 0), 0)

      return {
        mes: mes.nombre,
        costo: costoMantenimientos,
      }
    })

    resultado.push({
      area,
      datos: datosPorMes,
    })
  }

  return resultado
}

// Función para obtener el historial de mantenimientos
export async function getHistorialMantenimientos() {
  const maintenances = await getMaintenances()
  const machines = await getMachines()

  // Crear mapa de nombres de equipos
  const nombreEquipos = new Map<number, string>()
  machines.forEach((machine) => {
    nombreEquipos.set(machine.id, machine.name)
  })

  // Ordenar mantenimientos por fecha (más reciente primero)
  const historial = [...maintenances]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .map(async (mantenimiento) => {
      const repuestos = await getMaintenancePartsByMaintenanceId(mantenimiento.id)
      const costoRepuestos = repuestos.reduce((total, r) => total + r.total_costo, 0)

      return {
        id: mantenimiento.id,
        equipo: mantenimiento.machineName,
        tipo: mantenimiento.maintenanceType,
        fechaInicio: mantenimiento.startDate,
        fechaFin: mantenimiento.endDate || "En proceso",
        estado: mantenimiento.status,
        tecnico: mantenimiento.technician,
        costoMantenimiento: mantenimiento.cost || 0,
        costoRepuestos,
        costoTotal: (mantenimiento.cost || 0) + costoRepuestos,
        cantidadRepuestos: repuestos.length,
      }
    })

  return Promise.all(historial)
}

// Función para obtener los repuestos más utilizados
export async function getRepuestosMasUtilizados() {
  const maintenances = await getMaintenances()
  const inventoryItems = await getInventoryItems()

  // Obtener todos los repuestos utilizados
  const todosLosRepuestos: MaintenancePart[] = []
  for (const mantenimiento of maintenances) {
    const repuestos = await getMaintenancePartsByMaintenanceId(mantenimiento.id)
    todosLosRepuestos.push(...repuestos)
  }

  // Agrupar por item_inventario_id y sumar cantidades
  const repuestosPorId = new Map<
    number,
    {
      id: number
      nombre: string
      cantidadTotal: number
      costoTotal: number
      usos: number
    }
  >()

  todosLosRepuestos.forEach((repuesto) => {
    if (!repuestosPorId.has(repuesto.item_inventario_id)) {
      repuestosPorId.set(repuesto.item_inventario_id, {
        id: repuesto.item_inventario_id,
        nombre: repuesto.item_inventario_nombre,
        cantidadTotal: 0,
        costoTotal: 0,
        usos: 0,
      })
    }

    const datos = repuestosPorId.get(repuesto.item_inventario_id)!
    datos.cantidadTotal += repuesto.cantidad_utilizada
    datos.costoTotal += repuesto.total_costo
    datos.usos += 1
  })

  // Convertir a array y ordenar por cantidad total
  const resultado = Array.from(repuestosPorId.values()).sort((a, b) => b.cantidadTotal - a.cantidadTotal)

  return resultado
}

// Función para obtener comparativo entre mantenimiento preventivo y correctivo
export async function getComparativoPreventivosCorrectivos() {
  const maintenances = await getMaintenances()

  // Agrupar por tipo de mantenimiento
  const preventivos = maintenances.filter((m) => m.maintenanceType === "Preventivo")
  const correctivos = maintenances.filter((m) => m.maintenanceType === "Correctivo")
  const calibraciones = maintenances.filter((m) => m.maintenanceType === "Calibración")

  // Calcular costos totales
  const calcularCostoTotal = async (mantenimientos: Maintenance[]) => {
    let costoMantenimientos = 0
    let costoRepuestos = 0

    for (const mantenimiento of mantenimientos) {
      costoMantenimientos += mantenimiento.cost || 0

      const repuestos = await getMaintenancePartsByMaintenanceId(mantenimiento.id)
      costoRepuestos += repuestos.reduce((total, r) => total + r.total_costo, 0)
    }

    return {
      costoMantenimientos,
      costoRepuestos,
      costoTotal: costoMantenimientos + costoRepuestos,
    }
  }

  // Obtener datos por mes para los últimos 6 meses
  const meses = []
  const hoy = new Date()
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push({
      nombre: fecha.toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      mes: fecha.getMonth(),
      año: fecha.getFullYear(),
    })
  }

  const datosPorMes = meses.map((mes) => {
    // Filtrar mantenimientos por mes
    const preventivosMes = preventivos.filter((m) => {
      const fechaMantenimiento = new Date(m.startDate)
      return fechaMantenimiento.getMonth() === mes.mes && fechaMantenimiento.getFullYear() === mes.año
    })

    const correctivosMes = correctivos.filter((m) => {
      const fechaMantenimiento = new Date(m.startDate)
      return fechaMantenimiento.getMonth() === mes.mes && fechaMantenimiento.getFullYear() === mes.año
    })

    return {
      mes: mes.nombre,
      preventivos: preventivosMes.length,
      correctivos: correctivosMes.length,
    }
  })

  // Calcular resumen
  const resumenPreventivos = await calcularCostoTotal(preventivos)
  const resumenCorrectivos = await calcularCostoTotal(correctivos)
  const resumenCalibraciones = await calcularCostoTotal(calibraciones)

  return {
    resumen: {
      preventivos: {
        cantidad: preventivos.length,
        ...resumenPreventivos,
      },
      correctivos: {
        cantidad: correctivos.length,
        ...resumenCorrectivos,
      },
      calibraciones: {
        cantidad: calibraciones.length,
        ...resumenCalibraciones,
      },
    },
    tendenciaMensual: datosPorMes,
  }
}

// Función para obtener alertas activas (75% o más de uso)
export async function getAlertasActivas() {
  const machines = await getMachines()

  // Implementar lógica para obtener alertas de uso
  // Esta es una implementación simplificada
  const alertas = []

  // Aquí se implementaría la lógica real para obtener las alertas
  // basadas en el uso de piezas

  return alertas
}

// Función para obtener el estado de piezas críticas
export async function getEstadoPiezasCriticas() {
  // Implementar lógica para obtener el estado de piezas críticas
  // Esta es una implementación simplificada

  return []
}

// Función para obtener el gasto acumulado por equipo y área
export async function getGastoAcumulado() {
  const costoPorEquipo = await getCostoPorEquipo()

  // Agrupar por área
  const gastoPorArea = new Map<
    string,
    {
      area: string
      costoTotal: number
      equipos: { id: number; nombre: string; costo: number }[]
    }
  >()

  costoPorEquipo.forEach((equipo) => {
    const area = equipo.ubicacion

    if (!gastoPorArea.has(area)) {
      gastoPorArea.set(area, {
        area,
        costoTotal: 0,
        equipos: [],
      })
    }

    const datos = gastoPorArea.get(area)!
    datos.costoTotal += equipo.costoTotal
    datos.equipos.push({
      id: equipo.equipoId,
      nombre: equipo.equipoNombre,
      costo: equipo.costoTotal,
    })
  })

  // Convertir a array y ordenar por costo total
  const resultado = Array.from(gastoPorArea.values()).sort((a, b) => b.costoTotal - a.costoTotal)

  return resultado
}
