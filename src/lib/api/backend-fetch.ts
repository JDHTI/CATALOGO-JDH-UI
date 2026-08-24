import "server-only"

import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"

/**
 * Bypass temporal para despliegues de solo maqueta — ver `src/lib/auth/tenant.ts`.
 * Este módulo no se usa todavía en ninguna ruta, pero el mismo patrón evita
 * que empiece a usarse y tumbe el build por falta de `BACKEND_API_URL`.
 */
function requireEnv(name: string, fallback: string): string {
  const value = process.env[name]
  if (!value) {
    console.warn(
      `[backend-fetch] Falta la variable de entorno ${name} — usando placeholder (solo para visualizar la UI).`
    )
    return fallback
  }
  return value
}

export class BackendUnauthenticatedError extends Error {}

/**
 * Llama al backend del catálogo como el usuario autenticado actual. No hay
 * intercambio de tokens OAuth2: el backend valida la MISMA fila de `session`
 * que Better Auth creó aquí (mismo Postgres, mismo `BETTER_AUTH_SECRET`) —
 * este helper solo reenvía ese token de sesión como `Authorization: Bearer`
 * (la cookie no viaja entre dos orígenes servidor a servidor).
 *
 * Lanza `BackendUnauthenticatedError` si no hay sesión — nunca llama al backend
 * sin identidad. Para lecturas PÚBLICAS del catálogo (que son la mayoría del
 * tráfico) no uses este helper: no requieren identidad y forzarla rompería el
 * cacheado de las páginas anónimas. Añade un `publicFetch` cuando exista el
 * primer endpoint público real.
 */
export async function backendFetch(
  path: `/${string}`,
  init: RequestInit = {}
): Promise<Response> {
  const result = await auth.api.getSession({ headers: await headers() })
  if (!result) throw new BackendUnauthenticatedError()

  const baseUrl = requireEnv("BACKEND_API_URL", "http://localhost:0")
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${result.session.token}`,
    },
  })
}
