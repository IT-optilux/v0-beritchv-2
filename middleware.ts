import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const isAuthenticated = !!token;

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/";
      return NextResponse.redirect(loginUrl);
    }
  }

  if (req.nextUrl.pathname === "/") {
    if (isAuthenticated) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}




