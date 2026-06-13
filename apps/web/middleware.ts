import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/employees",
  "/payroll",
  "/payroll-runs",
  "/payslips",
  "/leave-management",
  "/reports",
  "/statutory-returns",
  "/company-settings",
  "/audit-logs",
  "/user-management",
  "/self-service",
];

export function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );
  const hasSession = request.cookies.has("access_token");
  const enforceAuth = process.env.NODE_ENV === "production";
  if (enforceAuth && isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
};
