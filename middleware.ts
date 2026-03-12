import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth needed
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check admin session
  const adminToken = req.cookies.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const session = await verifySession(adminToken);
    if (session) return NextResponse.next();
  }

  // For project routes, check project-specific cookie
  const projectSlug = pathname.split("/")[1];
  if (projectSlug) {
    const projectToken = req.cookies.get(`arbo_project_${projectSlug}`)?.value;
    if (projectToken) {
      const session = await verifySession(projectToken);
      if (session) return NextResponse.next();
    }
  }

  // Redirect to login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  if (projectSlug && projectSlug !== "login") {
    loginUrl.searchParams.set("project", projectSlug);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/).*)"],
};
