import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./lib/firebase-admin"

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"]

// Rutas públicas
const publicRoutes = ["/", "/login", "/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si la ruta actual requiere autenticación
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route))

  // Si no requiere autenticación, permitir el acceso
  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Obtener el token de la cookie de sesión
  const sessionCookie = request.cookies.get("session")?.value

  // Si no hay token, redirigir al login
  if (!sessionCookie) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  try {
    // Verificar el token con Firebase Admin
    await auth.verifySessionCookie(sessionCookie, true)
    return NextResponse.next()
  } catch (error) {
    // Si el token no es válido, redirigir al login
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. Archivos estáticos (_next/static, favicon.ico, etc.)
     * 2. Rutas de API (/api/*)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
