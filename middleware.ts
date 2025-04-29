import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"]

// Rutas públicas
const publicRoutes = ["/", "/login", "/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Crear respuesta base con headers de seguridad
  const response = NextResponse.next()

  // Añadir headers de seguridad
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Content Security Policy - ajustar según las necesidades de la aplicación
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com;",
  )

  // Verificar si la ruta actual requiere autenticación
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route))

  // Si no requiere autenticación, permitir el acceso
  if (!requiresAuth) {
    return response
  }

  // Obtener el token de la cookie de sesión
  const sessionCookie = request.cookies.get("session")?.value

  // Si no hay token, redirigir al login
  if (!sessionCookie) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Para verificar el token, necesitamos usar una API Route
  // ya que no podemos usar Firebase Admin directly en el middleware
  // debido a las limitaciones de Edge Runtime

  // Permitir el acceso si hay un token (la verificación real se hará en los componentes)
  return response
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. Archivos estáticos (_next/static, favicon.ico, etc.)
     * 2. Rutas de API (/api/*)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
