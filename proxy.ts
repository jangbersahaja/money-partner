import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/proxy-refresher";

export default async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // Protected routes that require authentication
  const protectedPaths = ["/", "/accounts", "/plan", "/debt"];
  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path + "/")
  );

  // Public routes that don't require authentication
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path + "/")
  );

  // Redirect to /login if accessing protected route without authentication
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to home if accessing public route while authenticated
  if (isPublicPath && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
