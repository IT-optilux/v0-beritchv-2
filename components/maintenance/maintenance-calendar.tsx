"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import type { Maintenance } from "@/types"
import { useRouter } from "next/navigation"

interface MaintenanceCalendarProps {
  maintenances: Maintenance[]
}

export function MaintenanceCalendar({ maintenances }: MaintenanceCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Calendar navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  // Check if a date has maintenances
  const getMaintenancesForDate = (date: Date) => {
    const dateString = formatDate(date)
    return maintenances.filter((m) => m.startDate === dateString)
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push(date)
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const maintenancesForDate = getMaintenancesForDate(date)

    if (maintenancesForDate.length > 0) {
      // If there are maintenances on this date, show the first one
      setSelectedMaintenance(maintenancesForDate[0])
      setIsViewModalOpen(true)
    } else {
      // If no maintenances, open form to add one
      setIsAddModalOpen(true)
    }
  }

  const handleAddSuccess = () => {
    setIsAddModalOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Hoy
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-7 gap-px border-b bg-gray-100">
          {weekdays.map((day, index) => (
            <div key={index} className="bg-white p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="bg-gray-50 p-2" />
            }

            const dateString = formatDate(day)
            const isToday = formatDate(new Date()) === dateString
            const maintenancesForDay = getMaintenancesForDate(day)
            const hasMaintenances = maintenancesForDay.length > 0

            return (
              <div
                key={dateString}
                className={`min-h-[80px] bg-white p-1 ${isToday ? "bg-blue-50" : ""} hover:bg-gray-50`}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "rounded-full bg-optilab-blue px-1.5 py-0.5 text-white" : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {hasMaintenances &&
                    maintenancesForDay.map((maintenance, idx) => (
                      <div
                        key={idx}
                        className={`truncate rounded px-1 py-0.5 text-xs ${
                          maintenance.maintenanceType === "Preventivo"
                            ? "bg-blue-100 text-blue-800"
                            : maintenance.maintenanceType === "Correctivo"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {maintenance.machineName}
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal for adding maintenance */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Programar Mantenimiento" size="lg">
        <MaintenanceForm
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          initialDate={selectedDate ? formatDate(selectedDate) : undefined}
        />
      </Modal>

      {/* Modal for viewing maintenance */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedMaintenance(null)
        }}
        title="Detalles del Mantenimiento"
        size="md"
      >
        {selectedMaintenance && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Equipo</p>
                <p>{selectedMaintenance.machineName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo</p>
                <p>{selectedMaintenance.maintenanceType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p>{selectedMaintenance.startDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p>{selectedMaintenance.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Técnico</p>
                <p>{selectedMaintenance.technician}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p>{selectedMaintenance.description}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedMaintenance(null)
                }}
              >
                Cerrar
              </Button>
              <Button
                className="bg-optilab-blue hover:bg-optilab-blue/90"
                onClick={() => router.push(`/dashboard/maintenance/${selectedMaintenance.id}`)}
              >
                Ver Detalles Completos
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
