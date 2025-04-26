import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import ReportsPage from "@/app/dashboard/reports/page"
import ReportDetailPage from "@/app/dashboard/reports/[id]/page"
import * as reportsActions from "@/app/actions/reports"

// Mock de next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue("/dashboard/reports"),
}))

// Mock de las acciones del servidor
jest.mock("@/app/actions/reports", () => ({
  getReports: jest.fn(),
  getReportById: jest.fn(),
  updateReport: jest.fn(),
  deleteReport: jest.fn(),
}))

// Mock del hook useToast
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn().mockReturnValue({
    toast: jest.fn(),
  }),
}))

// Mock de Link de Next.js
jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
})

// Datos de prueba
const mockReports = [
  {
    id: 1,
    machineId: 3,
    machineName: "Trazadora Computarizada",
    reportType: "Falla",
    description: "Error en el sistema de trazado, no reconoce patrones",
    reportedBy: "Juan Pérez",
    reportDate: "2023-04-10",
    status: "Pendiente",
    priority: "Alta",
    assignedTo: "Carlos Técnico",
  },
  {
    id: 2,
    machineId: 2,
    machineName: "Bloqueadora Digital",
    reportType: "Mantenimiento",
    description: "Mantenimiento preventivo programado",
    reportedBy: "María López",
    reportDate: "2023-04-08",
    status: "En proceso",
    priority: "Media",
    assignedTo: "Luis Mantenimiento",
  },
]

describe("Módulo de Reportes", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(reportsActions.getReports as jest.Mock).mockResolvedValue(mockReports)
    ;(reportsActions.getReportById as jest.Mock).mockImplementation((id) =>
      Promise.resolve(mockReports.find((report) => report.id === Number(id))),
    )
  })

  describe("Página de listado de reportes", () => {
    test("Muestra la lista de reportes correctamente", async () => {
      render(<ReportsPage />)

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(reportsActions.getReports).toHaveBeenCalled()
      })

      // Verificar que se muestran los reportes
      expect(screen.getByText("Trazadora Computarizada")).toBeInTheDocument()
      expect(screen.getByText("Bloqueadora Digital")).toBeInTheDocument()
    })

    test('Los botones "Ver detalles" tienen los enlaces correctos', async () => {
      render(<ReportsPage />)

      await waitFor(() => {
        expect(reportsActions.getReports).toHaveBeenCalled()
      })

      // Verificar que los enlaces tienen las URLs correctas
      const detailLinks = screen.getAllByText("Ver detalles")
      expect(detailLinks[0]).toHaveAttribute("href", "/dashboard/reports/1")
      expect(detailLinks[1]).toHaveAttribute("href", "/dashboard/reports/2")
    })
  })

  describe("Página de detalles del reporte", () => {
    test("Carga y muestra los detalles del reporte correctamente", async () => {
      render(<ReportDetailPage params={{ id: "1" }} />)

      await waitFor(() => {
        expect(reportsActions.getReportById).toHaveBeenCalledWith(1)
      })

      // Verificar que se muestran los detalles del reporte
      expect(screen.getByText("Reporte: Trazadora Computarizada")).toBeInTheDocument()
      expect(screen.getByText("Error en el sistema de trazado, no reconoce patrones")).toBeInTheDocument()
      expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
    })

    test("Muestra mensaje de error si el reporte no existe", async () => {
      // Simular que no se encuentra el reporte
      ;(reportsActions.getReportById as jest.Mock).mockResolvedValue(null)

      render(<ReportDetailPage params={{ id: "999" }} />)

      await waitFor(() => {
        expect(reportsActions.getReportById).toHaveBeenCalledWith(999)
      })

      // Verificar que se muestra el mensaje de error
      expect(screen.getByText("Reporte no encontrado.")).toBeInTheDocument()
    })

    test("El botón de editar abre el modal correctamente", async () => {
      render(<ReportDetailPage params={{ id: "1" }} />)

      await waitFor(() => {
        expect(reportsActions.getReportById).toHaveBeenCalledWith(1)
      })

      // Hacer clic en el botón de editar
      fireEvent.click(screen.getByText("Editar Reporte"))

      // Verificar que se abre el modal
      expect(screen.getByText("Editar Reporte")).toBeInTheDocument()
    })

    test("El botón de volver redirige a la lista de reportes", async () => {
      render(<ReportDetailPage params={{ id: "1" }} />)

      await waitFor(() => {
        expect(reportsActions.getReportById).toHaveBeenCalledWith(1)
      })

      // Hacer clic en el botón de volver
      const backButton = screen.getByRole("button", { name: "" }) // El botón con el ícono de flecha
      fireEvent.click(backButton)

      // Verificar que se redirige a la lista de reportes
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/reports")
    })
  })

  describe("Integración entre páginas", () => {
    test("Flujo completo: lista -> detalles -> edición -> vuelta a la lista", async () => {
      // Simular actualización exitosa
      ;(reportsActions.updateReport as jest.Mock).mockResolvedValue({
        success: true,
        message: "Reporte actualizado exitosamente",
      })

      // Renderizar la página de listado
      const { unmount } = render(<ReportsPage />)

      await waitFor(() => {
        expect(reportsActions.getReports).toHaveBeenCalled()
      })

      // Simular clic en "Ver detalles"
      const detailLinks = screen.getAllByText("Ver detalles")
      fireEvent.click(detailLinks[0])

      // Verificar que se intenta navegar a la página de detalles
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/reports/1")

      // Desmontar la página de listado
      unmount()

      // Renderizar la página de detalles
      render(<ReportDetailPage params={{ id: "1" }} />)

      await waitFor(() => {
        expect(reportsActions.getReportById).toHaveBeenCalledWith(1)
      })

      // Verificar que se muestran los detalles correctos
      expect(screen.getByText("Reporte: Trazadora Computarizada")).toBeInTheDocument()
    })
  })
})
