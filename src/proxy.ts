import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { PERMISSIONS } from "@/config/permissions"
import { auth } from "@/lib/auth/server"
import { hasSessionCookie } from "@/lib/auth/session-cookie"

/**
 * Edge middleware. Next.js 16 renames the `middleware.ts` convention to
 * `proxy.ts` (named `proxy` export + `config.matcher`). No edge runtime here
 * (Next 16's `proxy.ts` doesn't support it), so calling `auth.api.getSession`
 * directly — no edge-safe split config needed, unlike most Auth.js tutorials.
 *
 * Strategy: PUBLIC-FIRST — the inverse of a typical staff-only app's
 * protected-first proxy. The catalog is a public storefront: every route is
 * reachable without a session, and only the prefixes in `PROTECTED_PREFIXES`
 * require one. Adding a public page must never require touching this file;
 * adding a private area must.
 *
 * This is the optimistic, fast-fail layer. The authoritative check lives in
 * `admin/layout.tsx` and each private route's `page.tsx` (`requirePermissions`)
 * and in each Server Action — see `src/lib/auth/index.ts`.
 */
const PROTECTED_PREFIXES = ["/cuenta", "/listas", "/favoritos", "/carrito", "/admin"]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!isProtected(pathname)) return NextResponse.next()

  // La infraestructura de datos aún no está definida (ver ARCHITECTURE.md):
  // un fallo de conexión a Postgres no debe tumbar cada request a una ruta
  // protegida. Se trata igual que "sin sesión" — fail closed, nunca abierto.
  // Sin cookie de sesión no hay nada que verificar, así que ni se toca la DB.
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null
  if (hasSessionCookie(request.headers.get("cookie"))) {
    try {
      session = await auth.api.getSession({ headers: request.headers })
    } catch (error) {
      console.error("[proxy] No se pudo verificar la sesión:", error)
    }
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const signInUrl = new URL("/ingreso", request.url)
    signInUrl.searchParams.set("redirectTo", pathname + search)
    return NextResponse.redirect(signInUrl)
  }

  if (
    pathname.startsWith("/admin") &&
    !session.user.permissions.includes(PERMISSIONS.admin.access)
  ) {
    // 404, not 403: don't leak that /admin exists to a non-admin.
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next internals and files with an extension
  // (static assets). The public-first check above exits immediately for the
  // catalog, so this wide matcher costs nothing on public traffic.
  matcher: ["/((?!_next|.*\\..*).*)"],
}
