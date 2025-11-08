import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoginPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/";
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

  // If not authenticated and trying to access protected routes, redirect to login
  if (!token && !isLoginPage && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
