import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth/server"
import { hasSessionCookie } from "@/lib/auth/session-cookie"

const handlers = toNextJsHandler(auth)

/**
 * Todo Client Component que usa `useCurrentUser()` (el header, el mega menú,
 * `AuthActions`…) llama a `GET /api/auth/get-session` al montar — es decir,
 * en CADA carga de página, incluida la navegación anónima.
 *
 * Un visitante anónimo no manda la cookie de sesión, así que no hay nada que
 * verificar: se responde `null` (la misma forma que Better Auth devuelve
 * para "sin sesión") sin tocar Postgres. Esta es la vía que de verdad hacía
 * "persistir" el error de `password authentication` — cada carga de página
 * del catálogo público disparaba una consulta real, no solo el intento de
 * login.
 *
 * `wrap` sigue existiendo para el resto de rutas de Better Auth (sign-in,
 * sign-out, callbacks…), que sí necesitan tocar la DB incluso sin cookie: si
 * la infraestructura de datos falla ahí (ver ARCHITECTURE.md), se convierte
 * en un 503 controlado en vez de un 500 con stack trace.
 */
function wrap(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    if (
      request.method === "GET" &&
      request.nextUrl.pathname.endsWith("/get-session") &&
      !hasSessionCookie(request.headers.get("cookie"))
    ) {
      return NextResponse.json(null)
    }

    try {
      return await handler(request)
    } catch (error) {
      console.error(
        "[api/auth] Fallo de autenticación (infraestructura de datos pendiente):",
        error
      )
      return NextResponse.json({ error: "auth_unavailable" }, { status: 503 })
    }
  }
}

export const GET = wrap(handlers.GET)
export const POST = wrap(handlers.POST)
